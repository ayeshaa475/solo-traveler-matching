const repairTruncatedJson = (text) => {
  const lastBrace = text.lastIndexOf('}');
  if (lastBrace === -1) throw new Error('Cannot repair: no closing brace found');
  const truncated = text.substring(0, lastBrace + 1);
  const stack = [];
  let inStr = false;
  let esc = false;
  for (const ch of truncated) {
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    if (ch === '}' || ch === ']') stack.pop();
  }
  let repaired = truncated;
  for (let i = stack.length - 1; i >= 0; i--) repaired += stack[i] === '{' ? '}' : ']';
  console.log('[itineraryRefinementAgent] repaired JSON:', repaired);
  return JSON.parse(repaired);
};

const REMOVAL_PHRASES = ['remove', 'delete', 'eliminate', 'drop', 'get rid of', 'take out', 'cut this', 'skip this'];

const refineStop = async (originalStop, editRequest, context) => {
  const lower = editRequest.toLowerCase().trim();
  if (REMOVAL_PHRASES.some((p) => lower.includes(p))) {
    console.log('[itineraryRefinementAgent] Detected removal request, returning null');
    return null;
  }
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials — check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env');
  }

  const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;

  const { travelerNames, city, category } = context;

  const prompt = `You are editing one stop in a travel itinerary for ${travelerNames} in ${city} (activity category: ${category}).

Current stop:
- Time: ${originalStop.time || 'N/A'}
- Place: ${originalStop.place || 'N/A'}
- Description: ${originalStop.description || 'N/A'}
- Duration: ${originalStop.duration || 'N/A'}

Edit request: "${editRequest}"

Apply the edit and return the revised stop as a JSON object with exactly these four fields: time, place, description, duration.
Return only valid JSON, no markdown, no explanation.`;

  console.log('[itineraryRefinementAgent] Calling Cloudflare AI for stop refinement');

  const response = await fetch(CF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_tokens: 1024,
      messages: [
        { role: 'system', content: 'You are a travel itinerary editor. Always respond with valid JSON only, no markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[itineraryRefinementAgent] Cloudflare API error:', response.status, response.statusText);
    throw new Error(`Cloudflare AI request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  console.log('[itineraryRefinementAgent] Cloudflare raw response:', JSON.stringify(data));

  const text = data.result?.response;
  if (!text) throw new Error('No response from Cloudflare AI');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Cloudflare AI response');

  const raw = jsonMatch[0];
  try {
    return JSON.parse(raw);
  } catch (parseErr) {
    console.warn('[itineraryRefinementAgent] JSON parse failed, attempting repair. Error:', parseErr.message);
    return repairTruncatedJson(raw);
  }
};

module.exports = { refineStop };

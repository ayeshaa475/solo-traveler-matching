const repairTruncatedJson = (text) => {
  // Find the last complete closing brace so we only keep complete stop objects
  const lastBrace = text.lastIndexOf('}');
  if (lastBrace === -1) throw new Error('Cannot repair: no closing brace found');

  const truncated = text.substring(0, lastBrace + 1);

  // Walk the truncated text with a stack to find unclosed brackets/braces
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

  // Close unclosed brackets and braces in reverse order
  let repaired = truncated;
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === '{' ? '}' : ']';
  }

  console.log('[aiService] repaired JSON:', repaired);
  return JSON.parse(repaired);
};

const generateItinerary = async (match) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  console.log('[aiService] CLOUDFLARE_ACCOUNT_ID set:', !!accountId);
  console.log('[aiService] CLOUDFLARE_API_TOKEN set:', !!apiToken);

  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials — check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env');
  }

  const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;

  const { activity, participants } = match;
  const names = participants.map((p) => p.name).join(' and ');
  const interests = [...new Set(participants.flatMap((p) => p.interests || []))].join(', ');
  const dateStr = activity.date instanceof Date
    ? activity.date.toDateString()
    : new Date(activity.date).toDateString();

  const venueClause = activity.venueName
    ? `The travelers have already chosen to meet at ${activity.venueName} (${activity.venueAddress || activity.city}) as their starting point. Build the rest of the itinerary around this location, keeping all stops within a reasonable distance. The first stop must be ${activity.venueName}.`
    : '';

  const prompt = `You are a travel planner. Create a detailed day itinerary for ${names} who are solo travelers meeting to do "${activity.title}" in ${activity.city} on ${dateStr}.
Their shared interests include: ${interests || 'general exploration'}.
Activity category: ${activity.category}.
${venueClause}

Return a JSON object with:
- "content": a friendly summary paragraph
- "stops": array of { time, place, description, duration }

Keep it practical and fun for people meeting for the first time.
Return only valid JSON, no markdown or extra text.`;

  console.log('[aiService] Calling Cloudflare AI at:', CF_URL);

  const response = await fetch(CF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_tokens: 1024,
      messages: [
        { role: 'system', content: 'You are a travel planner. Always respond with valid JSON only, no markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[aiService] Cloudflare API error:', response.status, response.statusText);
    console.error('[aiService] Cloudflare error body:', errorBody);
    throw new Error(`Cloudflare AI request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  console.log('[aiService] Cloudflare raw response:', JSON.stringify(data));

  const text = data.result?.response;
  if (!text) {
    console.error('[aiService] No response text in:', JSON.stringify(data));
    throw new Error('No response from Cloudflare AI');
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[aiService] Could not find JSON in response text:', text);
    throw new Error('No JSON found in Cloudflare AI response');
  }

  const raw = jsonMatch[0];

  try {
    return JSON.parse(raw);
  } catch (parseErr) {
    console.warn('[aiService] JSON parse failed, attempting repair. Error:', parseErr.message);
    console.warn('[aiService] Raw text to repair:', raw);
    return repairTruncatedJson(raw);
  }
};

module.exports = { generateItinerary };

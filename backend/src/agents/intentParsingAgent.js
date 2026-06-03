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
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === '{' ? '}' : ']';
  }

  console.log('[intentParsingAgent] repaired JSON:', repaired);
  return JSON.parse(repaired);
};

const SYSTEM_PROMPT = `You are an intent parser for a solo traveler matching app.
Given a freeform string describing what a traveler wants to do, extract structured information and return ONLY a valid JSON object with no markdown, no explanation, no extra text.

The JSON must have exactly these fields:
- category: one of "hiking", "food", "music", "museums", "photography", "cycling", "yoga", "coffee", "amusement_parks", "cooking", "art", "sports", "other"
- city: the city name as a string, or null if not mentioned
- date: the date as a string (e.g. "tomorrow", "2024-12-25", "this Saturday"), or null if not mentioned
- time_preference: one of "morning", "afternoon", "evening", "flexible"
- vibe: one of "adventurous", "relaxed", "social", "cultural"
- description: the core activity as a concise search-friendly noun phrase suitable for a Google Places query (e.g. "pottery studio", "painting class", "yoga studio", "cooking class", "street food tour", "jazz bar", "rock climbing gym") — for the "other" category always preserve the exact activity noun the person mentioned; never write a full sentence

Return only the JSON object. No markdown code blocks, no preamble.`;

const parseIntent = async (rawText) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  console.log('[intentParsingAgent] CLOUDFLARE_ACCOUNT_ID set:', !!accountId);
  console.log('[intentParsingAgent] CLOUDFLARE_API_TOKEN set:', !!apiToken);

  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials — check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env');
  }

  const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;

  console.log('[intentParsingAgent] Calling Cloudflare AI for intent:', rawText);

  const response = await fetch(CF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: rawText },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[intentParsingAgent] Cloudflare API error:', response.status, response.statusText);
    console.error('[intentParsingAgent] Cloudflare error body:', errorBody);
    throw new Error(`Cloudflare AI request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  console.log('[intentParsingAgent] Cloudflare raw response:', JSON.stringify(data));

  const text = data.result?.response;
  if (!text) {
    console.error('[intentParsingAgent] No response text in:', JSON.stringify(data));
    throw new Error('No response from Cloudflare AI');
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[intentParsingAgent] Could not find JSON in response text:', text);
    throw new Error('No JSON found in Cloudflare AI response');
  }

  const raw = jsonMatch[0];

  try {
    return JSON.parse(raw);
  } catch (parseErr) {
    console.warn('[intentParsingAgent] JSON parse failed, attempting repair. Error:', parseErr.message);
    console.warn('[intentParsingAgent] Raw text to repair:', raw);
    return repairTruncatedJson(raw);
  }
};

module.exports = { parseIntent };

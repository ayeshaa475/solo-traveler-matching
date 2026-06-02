const CATEGORY_TYPES = {
  food:       ['restaurant', 'cafe', 'bakery'],
  nightlife:  ['bar', 'night_club', 'restaurant'],
  culture:    ['museum', 'art_gallery', 'tourist_attraction'],
  hiking:     ['park', 'campground', 'natural_feature'],
  adventure:  ['park', 'amusement_park', 'tourist_attraction'],
  relaxation: ['spa', 'park', 'cafe'],
  other:      ['tourist_attraction', 'restaurant', 'park'],
};

const fetchNearbyVenues = async (lat, lng, category) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const types = CATEGORY_TYPES[category] || CATEGORY_TYPES.other;
  const base = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  const results = await Promise.all(
    types.map(async (type) => {
      try {
        const res = await fetch(`${base}?location=${lat},${lng}&radius=1500&type=${type}&key=${apiKey}`);
        const data = await res.json();
        if (data.status !== 'OK' || !data.results?.length) return null;
        const place = data.results[0];
        return { name: place.name, address: place.vicinity, place_id: place.place_id };
      } catch {
        return null;
      }
    })
  );

  const seen = new Set();
  return results.filter((v) => {
    if (!v || seen.has(v.place_id)) return false;
    seen.add(v.place_id);
    return true;
  });
};

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

  let venueClause = '';
  const hasCoords = activity.location?.lat != null && activity.location?.lng != null;

  if (hasCoords) {
    console.log('[aiService] Fetching nearby venues for', activity.category, 'at', activity.location.lat, activity.location.lng);
    const nearby = await fetchNearbyVenues(activity.location.lat, activity.location.lng, activity.category);
    console.log('[aiService] Nearby venues found:', nearby.length);

    if (activity.venueName) {
      const startAddr = activity.venueAddress || activity.city;
      if (nearby.length > 0) {
        const nearbyList = nearby
          .map((v) => `${v.name} (${v.address || activity.city})`)
          .join(', ');
        venueClause = `The first stop MUST be ${activity.venueName} at ${startAddr}. Then continue with these nearby venues in order: ${nearbyList}.`;
      } else {
        venueClause = `The first stop MUST be ${activity.venueName} at ${startAddr}.`;
      }
    } else if (nearby.length > 0) {
      const venueList = nearby
        .map((v) => `${v.name} (${v.address || activity.city})`)
        .join(', ');
      venueClause = `Build an itinerary using ONLY these specific venues in order, do not suggest any other locations: ${venueList}. Write connecting narrative between them and suggest realistic timings.`;
    }
  }

  if (!venueClause && activity.venueName) {
    venueClause = `The first stop MUST be ${activity.venueName} at ${activity.venueAddress || activity.city}. Keep all other stops nearby.`;
  }

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

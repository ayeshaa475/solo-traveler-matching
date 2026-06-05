const REMOVAL_PHRASES = ['remove', 'delete', 'eliminate', 'drop', 'get rid of', 'take out', 'cut this', 'skip this'];

const ONE_MILE_METERS = 1609;

const CATEGORY_TYPES = {
  food:       ['restaurant', 'cafe', 'bakery'],
  nightlife:  ['bar', 'night_club', 'restaurant'],
  culture:    ['museum', 'art_gallery', 'tourist_attraction'],
  hiking:     ['park', 'campground', 'natural_feature'],
  adventure:  ['park', 'amusement_park', 'tourist_attraction'],
  relaxation: ['spa', 'park', 'cafe'],
  other:      ['tourist_attraction', 'restaurant', 'park'],
};

// Known venue type keywords, longest first so multi-word phrases match before single words
const KNOWN_VENUE_TYPES = [
  'coffee house', 'coffee shop', 'cocktail bar', 'wine bar', 'rooftop bar',
  'art gallery', 'botanical garden', 'farmers market', 'ice cream shop',
  'dessert shop', 'dance club', 'fitness center', 'yoga studio', 'night club',
  'brew pub', 'book shop', 'bookstore', 'nightclub', 'restaurant', 'brewery',
  'bistro', 'brasserie', 'patisserie', 'cafeteria', 'museum', 'gallery',
  'library', 'bakery', 'diner', 'eatery', 'lounge', 'tavern', 'bar', 'pub',
  'cafe', 'park', 'garden', 'market', 'cinema', 'theater', 'theatre',
  'arcade', 'bowling', 'beach', 'spa', 'gym',
];

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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

// Extract venue type the user asked for (e.g. "swap with a coffee shop" → "coffee shop")
const extractVenueKeyword = (editRequest) => {
  const lower = editRequest.toLowerCase().trim();

  // Pattern 1: swap/replace/change/switch … with/to/for … a <venue>
  const swapMatch = lower.match(
    /(?:swap|replace|change|switch|substitute)\s+(?:(?:this|the)\s+)?(?:stop|place|venue|it)?\s*(?:with|to|for)\s+(?:a\s+|an\s+|the\s+)?([a-z][a-z\s]{1,30}?)(?:\s+(?:nearby|instead|close|near here))?(?:[,.]|$)/
  );
  if (swapMatch) return swapMatch[1].trim();

  // Pattern 2: find/get/try/use/want/need a <venue>
  const findMatch = lower.match(
    /(?:find|get|try|use|want|need|prefer)\s+(?:a\s+|an\s+|the\s+)([a-z][a-z\s]{1,30}?)(?:\s+(?:nearby|instead|close|near here))?(?:[,.]|$)/
  );
  if (findMatch) return findMatch[1].trim();

  // Pattern 3: scan for a known venue keyword anywhere in the request
  for (const kw of KNOWN_VENUE_TYPES) {
    if (lower.includes(kw)) return kw;
  }

  return null;
};

// Fetch venues by user-specified keyword; falls back to category types when no keyword given
const fetchNearbyVenuesForRefinement = async (lat, lng, category, venueKeyword) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const base = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  if (venueKeyword) {
    try {
      const url = `${base}?location=${lat},${lng}&radius=${ONE_MILE_METERS}&keyword=${encodeURIComponent(venueKeyword)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) return [];
      return data.results.slice(0, 10).map((place) => ({
        name: place.name,
        address: place.vicinity,
        place_id: place.place_id,
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      }));
    } catch {
      return [];
    }
  }

  // No user keyword — fall back to category-based type search
  const types = CATEGORY_TYPES[category] || CATEGORY_TYPES.other;
  const allResults = await Promise.all(
    types.map(async (type) => {
      try {
        const res = await fetch(`${base}?location=${lat},${lng}&radius=${ONE_MILE_METERS}&type=${type}&key=${apiKey}`);
        const data = await res.json();
        if (data.status !== 'OK' || !data.results?.length) return [];
        return data.results.slice(0, 5).map((place) => ({
          name: place.name,
          address: place.vicinity,
          place_id: place.place_id,
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
        }));
      } catch {
        return [];
      }
    })
  );

  const seen = new Set();
  return allResults.flat().filter((v) => {
    if (!v || !v.place_id || seen.has(v.place_id)) return false;
    seen.add(v.place_id);
    return true;
  });
};

const findVenueByName = (name, venues) => {
  if (!name) return null;
  const lower = name.toLowerCase();
  return venues.find((v) =>
    v.name && (lower.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(lower))
  ) || null;
};

const callCloudflareAI = async (messages, accountId, apiToken) => {
  const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
  const response = await fetch(CF_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_tokens: 1024, messages }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
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

const isWithinOneMile = (actLat, actLng, venue) => {
  if (venue.lat == null || venue.lng == null) return false;
  return haversineDistance(actLat, actLng, venue.lat, venue.lng) <= ONE_MILE_METERS;
};

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

  const { travelerNames, city, category, location } = context;
  const hasCoords = location?.lat != null && location?.lng != null;

  const venueKeyword = extractVenueKeyword(editRequest);
  console.log('[itineraryRefinementAgent] Extracted venue keyword:', venueKeyword);

  let nearbyVenues = [];
  if (hasCoords) {
    console.log('[itineraryRefinementAgent] Fetching nearby venues within 1 mile for refinement');
    nearbyVenues = await fetchNearbyVenuesForRefinement(location.lat, location.lng, category, venueKeyword);
    console.log('[itineraryRefinementAgent] Nearby venues for refinement:', nearbyVenues.length);
  }

  // If the user specified a venue type but nothing matched, fail early with a clear message
  if (venueKeyword && hasCoords && nearbyVenues.length === 0) {
    const label = venueKeyword.endsWith('s') ? venueKeyword : `${venueKeyword}s`;
    const err = new Error(`No ${label} found within walking distance — try something closer to ${originalStop.place || city}`);
    err.code = 'NO_NEARBY_VENUE';
    throw err;
  }

  const buildPrompt = (strict) => {
    let venueClause = '';
    if (nearbyVenues.length > 0) {
      const venueList = nearbyVenues.map((v) => `${v.name} (${v.address || city})`).join(', ');
      if (strict) {
        venueClause = `You MUST choose a venue from this list only: ${venueList}.`;
      } else {
        venueClause = `Available nearby venues (all within walking distance): ${venueList}.`;
      }
    } else if (hasCoords) {
      venueClause = 'Only suggest venues within walking distance (1 mile) of the current location.';
    }

    const requestClause = venueKeyword
      ? `The user wants to replace this stop with a ${venueKeyword}. Only suggest venues that match this request. Do not suggest unrelated venues.`
      : `Edit request: "${editRequest}"`;

    return `You are editing one stop in a travel itinerary for ${travelerNames} in ${city} (activity category: ${category}).

Current stop:
- Time: ${originalStop.time || 'N/A'}
- Place: ${originalStop.place || 'N/A'}
- Description: ${originalStop.description || 'N/A'}
- Duration: ${originalStop.duration || 'N/A'}

${requestClause}

${venueClause}

Apply the edit and return the revised stop as a JSON object with exactly these four fields: time, place, description, duration.
Return only valid JSON, no markdown, no explanation.`;
  };

  const systemMsg = {
    role: 'system',
    content: 'You are a travel itinerary editor. Always respond with valid JSON only, no markdown, no explanation.',
  };

  console.log('[itineraryRefinementAgent] Calling Cloudflare AI for stop refinement');
  let proposed = await callCloudflareAI(
    [systemMsg, { role: 'user', content: buildPrompt(false) }],
    accountId, apiToken
  );

  // Skip proximity validation if no GPS context, no venue list, or the place didn't change
  const placeChanged = proposed.place && proposed.place !== originalStop.place;
  if (!hasCoords || nearbyVenues.length === 0 || !placeChanged) {
    return proposed;
  }

  // Validate the proposed venue is within 1 mile
  const matched = findVenueByName(proposed.place, nearbyVenues);
  if (matched && isWithinOneMile(location.lat, location.lng, matched)) {
    return proposed;
  }

  // Retry with strict venue list
  console.log('[itineraryRefinementAgent] Proposed venue out of range or unrecognized, retrying with strict list');
  proposed = await callCloudflareAI(
    [systemMsg, { role: 'user', content: buildPrompt(true) }],
    accountId, apiToken
  );

  const matchedRetry = findVenueByName(proposed.place, nearbyVenues);
  if (matchedRetry && isWithinOneMile(location.lat, location.lng, matchedRetry)) {
    return proposed;
  }

  // Still no valid venue after retry
  const neighborhood = originalStop.place || city;
  const label = venueKeyword
    ? (venueKeyword.endsWith('s') ? venueKeyword : `${venueKeyword}s`)
    : 'venues';
  const err = new Error(`No ${label} found within walking distance — try something closer to ${neighborhood}`);
  err.code = 'NO_NEARBY_VENUE';
  throw err;
};

module.exports = { refineStop };

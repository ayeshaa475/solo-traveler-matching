const Activity = require('../models/Activity');
const { parseIntent } = require('../agents/intentParsingAgent');

exports.parseActivity = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text is required' });
    const parsed = await parseIntent(text.trim());
    res.json(parsed);
  } catch (err) {
    console.error('[activityController] parseActivity error:', err.message);
    res.status(500).json({ message: `Intent parsing failed: ${err.message}` });
  }
};


// Validates a photo_reference by following the Places Photo redirect.
// Returns null if the redirect destination is a staticmap (synthetic Google map image).
const validatePhotoRef = async (photoRef, apiKey) => {
  if (!photoRef) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1&photo_reference=${photoRef}&key=${apiKey}`;
    const res = await fetch(url); // follows redirects by default
    await res.body?.cancel();     // discard body — we only need the final URL
    const finalUrl = res.url || '';
    const isStaticMap = finalUrl.includes('staticmap') || finalUrl.includes('/maps/api/static');
    console.log(`[validatePhotoRef] ${isStaticMap ? 'REJECTED (staticmap)' : 'OK'}: ${finalUrl.substring(0, 80)}`);
    return isStaticMap ? null : photoRef;
  } catch (err) {
    console.warn('[validatePhotoRef] check failed, keeping ref:', err.message);
    return photoRef;
  }
};

exports.suggestActivity = async (req, res) => {
  try {
    const { text, city: bodyCity } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text is required' });

    const parsed = await parseIntent(text.trim());
    const city = parsed.city || bodyCity || null;

    if (!city) {
      return res.status(400).json({ message: 'Could not determine city from your description. Add a city name and try again.' });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not set in environment');

    const query = `${parsed.description} ${city}`;
    console.log('[suggestActivity] Places query:', query);

    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    console.log('[suggestActivity] Places status:', placesData.status);

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${placesData.status}${placesData.error_message ? ' — ' + placesData.error_message : ''}`);
    }

    const results = [...(placesData.results || [])];
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    const venues = await Promise.all(results.slice(0, 3).map(async (place) => {
      const rawRef = place.photos?.[0]?.photo_reference ?? null;
      const photoReference = await validatePhotoRef(rawRef, apiKey);
      return {
        name: place.name,
        address: place.formatted_address,
        place_id: place.place_id,
        lat: place.geometry?.location?.lat ?? null,
        lng: place.geometry?.location?.lng ?? null,
        photoReference,
      };
    }));

    res.json({ parsed, venues, activityLabel: parsed.description });
  } catch (err) {
    console.error('[activityController] suggestActivity error:', err.message);
    res.status(500).json({ message: `Venue suggestion failed: ${err.message}` });
  }
};

exports.createActivity = async (req, res) => {
  try {
    console.log('[createActivity] photoReference from body:', req.body.photoReference);
    const activity = await Activity.create({ ...req.body, user: req.user.id });
    console.log('[createActivity] saved photoReference:', activity.photoReference);
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .populate('user', 'name bio interests')
      .sort({ date: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

exports.getActivities = async (req, res) => {
  try {
    const { city, category, date, excludeUserId, lat, lng, radius } = req.query;
    const filter = { status: 'open' };
    if (city) {
      const CITY_ALIASES = {
        'new york city': 'new york',
        'nyc': 'new york',
        'ny': 'new york',
        'sf': 'san francisco',
        'la': 'los angeles',
      };
      const normalized = city.trim().toLowerCase();
      const cityQuery = CITY_ALIASES[normalized] || city.trim();
      filter.city = new RegExp(cityQuery, 'i');
    }
    if (category) filter.category = category;
    if (date) filter.date = { $gte: new Date(date) };
    if (excludeUserId) filter.user = { $ne: excludeUserId };

    let activities = await Activity.find(filter)
      .populate('user', 'name bio interests averageRating completedMeetups')
      .sort({ date: 1 });

    if (lat != null && lng != null) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const r = radius ? parseFloat(radius) : 40;
      activities = activities.filter((a) => {
        if (a.location?.lat == null || a.location?.lng == null) return true;
        return haversineDistance(userLat, userLng, a.location.lat, a.location.lng) <= r;
      });
    }

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.proxyPhoto = async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return res.status(500).end();

    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${req.params.photoReference}&key=${apiKey}`;
    const googleRes = await fetch(url); // follows the 302 redirect to lh3.googleusercontent.com
    if (!googleRes.ok) return res.status(502).end();

    res.set('Content-Type', googleRes.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await googleRes.arrayBuffer()));
  } catch {
    res.status(500).end();
  }
};

exports.getActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('user', 'name bio interests');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    if (activity.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await activity.deleteOne();
    res.json({ message: 'Activity removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

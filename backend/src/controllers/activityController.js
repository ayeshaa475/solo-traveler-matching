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

const LEADING_VERBS = new Set(['visit', 'explore', 'find', 'do', 'try', 'go', 'see', 'attend', 'join', 'take', 'check', 'want', 'looking', 'looking for']);

const extractActivityLabel = (description) => {
  if (!description) return 'activity';
  const words = description.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
  const trimmed = LEADING_VERBS.has(words[0]) ? words.slice(1) : words;
  return trimmed.slice(0, 4).join(' ');
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

    const activityLabel = extractActivityLabel(parsed.description);
    const query = `${activityLabel} in ${city}`;
    console.log('[suggestActivity] Places query:', query);

    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    console.log('[suggestActivity] Places status:', placesData.status);

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${placesData.status}${placesData.error_message ? ' — ' + placesData.error_message : ''}`);
    }

    const venues = (placesData.results || []).slice(0, 3).map((place) => ({
      name: place.name,
      address: place.formatted_address,
      place_id: place.place_id,
    }));

    res.json({ parsed, venues, activityLabel });
  } catch (err) {
    console.error('[activityController] suggestActivity error:', err.message);
    res.status(500).json({ message: `Venue suggestion failed: ${err.message}` });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const activity = await Activity.create({ ...req.body, user: req.user.id });
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

exports.getActivities = async (req, res) => {
  try {
    const { city, category, date, excludeUserId } = req.query;
    const filter = { status: 'open' };
    if (city) filter.city = new RegExp(city, 'i');
    if (category) filter.category = category;
    if (date) filter.date = { $gte: new Date(date) };
    if (excludeUserId) filter.user = { $ne: excludeUserId };

    const activities = await Activity.find(filter)
      .populate('user', 'name bio interests averageRating completedMeetups')
      .sort({ date: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

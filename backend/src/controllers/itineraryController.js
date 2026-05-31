const Itinerary = require('../models/Itinerary');
const Match = require('../models/Match');
const aiService = require('../services/aiService');

exports.generateItinerary = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId)
      .populate('activity')
      .populate('participants', 'name interests bio');

    if (!match) return res.status(404).json({ message: 'Match not found' });

    const itineraryData = await aiService.generateItinerary(match);
    const itinerary = await Itinerary.create({
      match: matchId,
      content: itineraryData.content,
      stops: itineraryData.stops,
    });

    await Match.findByIdAndUpdate(matchId, { itinerary: itinerary._id });

    const payload = itinerary.toObject();
    payload._id = itinerary._id.toString();
    console.log('[itineraryController] sending itinerary payload, _id:', payload._id, 'type:', typeof payload._id);
    res.status(201).json(payload);
  } catch (err) {
    console.error('[itineraryController] generateItinerary error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate('match');
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });
    res.json(itinerary);
  } catch (err) {
    console.error('[itineraryController] getItinerary error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

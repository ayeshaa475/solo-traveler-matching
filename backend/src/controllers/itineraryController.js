const Itinerary = require('../models/Itinerary');
const Match = require('../models/Match');
const aiService = require('../services/aiService');
const { refineStop } = require('../agents/itineraryRefinementAgent');
const { getIO } = require('../socket');

const populateItinerary = (id) =>
  Itinerary.findById(id).populate({
    path: 'match',
    populate: { path: 'participants', select: 'name' },
  });

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
    const itinerary = await populateItinerary(req.params.id);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });
    res.json(itinerary);
  } catch (err) {
    console.error('[itineraryController] getItinerary error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.proposeRevision = async (req, res) => {
  try {
    const { stop_index, edit_request } = req.body;

    const itinerary = await Itinerary.findById(req.params.id).populate({
      path: 'match',
      populate: [
        { path: 'participants', select: 'name' },
        { path: 'activity', select: 'city category' },
      ],
    });

    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });
    if (itinerary.pendingRevision) {
      return res.status(409).json({ message: 'A revision is already pending' });
    }
    if (stop_index < 0 || stop_index >= itinerary.stops.length) {
      return res.status(400).json({ message: 'Invalid stop index' });
    }

    const originalStop = itinerary.stops[stop_index].toObject();
    const match = itinerary.match;
    const travelerNames = match.participants.map((p) => p.name).join(' and ');
    const city = match.activity?.city || '';
    const category = match.activity?.category || '';

    const proposedStop = await refineStop(originalStop, edit_request, { travelerNames, city, category });

    itinerary.pendingRevision = {
      stop_index,
      original_stop: originalStop,
      proposed_stop: proposedStop,
      requested_by: req.user.id,
      status: 'pending',
    };
    await itinerary.save();

    const updated = await populateItinerary(itinerary._id);
    const io = getIO();
    match.participants.forEach((p) => {
      io.to(String(p._id)).emit('itinerary_revision_proposed', updated);
    });

    res.json(updated);
  } catch (err) {
    console.error('[itineraryController] proposeRevision error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.resolveRevision = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be accept or reject' });
    }

    const itinerary = await Itinerary.findById(req.params.id).populate({
      path: 'match',
      populate: { path: 'participants', select: 'name' },
    });

    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });
    if (!itinerary.pendingRevision) {
      return res.status(400).json({ message: 'No pending revision' });
    }

    const proposerId = String(itinerary.pendingRevision.requested_by);
    if (proposerId === String(req.user.id)) {
      return res.status(403).json({ message: 'Cannot resolve your own revision' });
    }

    if (action === 'accept') {
      const { stop_index, proposed_stop } = itinerary.pendingRevision;
      if (proposed_stop == null) {
        itinerary.stops.splice(stop_index, 1);
      } else {
        itinerary.stops[stop_index].time = proposed_stop.time;
        itinerary.stops[stop_index].place = proposed_stop.place;
        itinerary.stops[stop_index].description = proposed_stop.description;
        itinerary.stops[stop_index].duration = proposed_stop.duration;
      }
      itinerary.markModified('stops');
    }

    itinerary.pendingRevision = null;
    await itinerary.save();

    const updated = await populateItinerary(itinerary._id);
    const io = getIO();
    itinerary.match.participants.forEach((p) => {
      io.to(String(p._id)).emit('itinerary_revision_resolved', { itinerary: updated, action });
    });

    res.json(updated);
  } catch (err) {
    console.error('[itineraryController] resolveRevision error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

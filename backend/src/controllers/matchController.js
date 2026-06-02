const Match = require('../models/Match');
const Activity = require('../models/Activity');
const Itinerary = require('../models/Itinerary');
const User = require('../models/User');
const Notification = require('../models/Notification');
const matchingService = require('../services/matchingService');
const { getIO } = require('../socket');

exports.findMatches = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await Activity.findById(activityId).populate('user');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const candidates = await Activity.find({
      _id: { $ne: activityId },
      city: { $regex: new RegExp(`^${activity.city}$`, 'i') },
      status: 'open',
      user: { $ne: activity.user._id },
    }).populate('user', 'name bio interests trustScore');

    console.log(`[findMatches] activityId=${activityId} city="${activity.city}" found ${candidates.length} candidates`);

    const scored = matchingService.scoreMatches(activity, candidates);
    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMatch = async (req, res) => {
  try {
    const { activityId, targetUserId } = req.body;

    const existing = await Match.findOne({
      activity: activityId,
      participants: { $all: [req.user.id, targetUserId] },
    });
    if (existing) return res.status(200).json(existing);

    const match = await Match.create({
      activity: activityId,
      participants: [req.user.id, targetUserId],
      initiator: req.user.id,
    });

    // Notify the activity owner
    try {
      const [sender, activity] = await Promise.all([
        User.findById(req.user.id).select('name'),
        Activity.findById(activityId).select('title user'),
      ]);
      if (sender && activity && activity.user.toString() !== req.user.id) {
        const notification = await Notification.create({
          recipient: activity.user,
          sender: req.user.id,
          type: 'new_match',
          message: `${sender.name} wants to join your "${activity.title}"`,
        });
        const io = getIO();
        if (io) {
          console.log(`[createMatch] emitting notification to room '${activity.user.toString()}'`);
          io.to(activity.user.toString()).emit('notification', {
            _id: notification._id,
            type: notification.type,
            message: notification.message,
            read: notification.read,
            createdAt: notification.createdAt,
            sender: { name: sender.name },
          });
        }
      }
    } catch (notifErr) {
      console.error('[createMatch] notification error:', notifErr.message);
    }

    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.advanceStatus = async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, participants: req.user.id })
      .populate('activity');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const transitions = { pending: 'confirmed', confirmed: 'completed' };
    const next = transitions[match.status];
    if (!next) return res.status(400).json({ message: 'Match is already completed' });

    // Only the activity owner can accept (pending → confirmed)
    if (match.status === 'pending') {
      const ownerId = match.activity?.user?.toString();
      if (ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Only the activity owner can accept this match.' });
      }
    }

    if (next === 'completed' && !match.itinerary) {
      return res.status(400).json({ message: 'Generate an itinerary before marking complete.' });
    }

    match.status = next;
    await match.save();

    // Emit socket event to all participants with fully populated match
    const io = getIO();
    if (io) {
      const populatedMatch = await Match.findById(match._id)
        .populate({ path: 'activity', populate: { path: 'user', select: 'name _id' } })
        .populate('participants', 'name email bio')
        .populate('initiator', 'name');
      match.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit('match_updated', populatedMatch);
      });
    }

    res.json({ status: match.status });
  } catch (err) {
    console.error('[matchController] advanceStatus error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, participants: req.user.id });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.itinerary) {
      await Itinerary.findByIdAndDelete(match.itinerary);
    }
    await Match.findByIdAndDelete(req.params.id);
    res.json({ message: 'Match deleted' });
  } catch (err) {
    console.error('[matchController] deleteMatch error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getActivityMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      activity: req.params.activityId,
      participants: req.user.id,
    }).populate('participants', 'name interests bio averageRating completedMeetups');
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({ participants: req.user.id })
      .populate({ path: 'activity', populate: { path: 'user', select: 'name _id' } })
      .populate('participants', 'name email bio averageRating completedMeetups')
      .populate('initiator', 'name');
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

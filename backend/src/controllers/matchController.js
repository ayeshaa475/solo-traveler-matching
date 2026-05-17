const Match = require('../models/Match');
const Activity = require('../models/Activity');
const matchingService = require('../services/matchingService');

exports.findMatches = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await Activity.findById(activityId).populate('user');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const candidates = await Activity.find({
      _id: { $ne: activityId },
      city: activity.city,
      category: activity.category,
      status: 'open',
      date: {
        $gte: new Date(activity.date.getTime() - 24 * 60 * 60 * 1000),
        $lte: new Date(activity.date.getTime() + 24 * 60 * 60 * 1000),
      },
      user: { $ne: activity.user._id },
    }).populate('user', 'name bio interests');

    const scored = matchingService.scoreMatches(activity, candidates);
    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMatch = async (req, res) => {
  try {
    const { activityId, targetUserId } = req.body;
    const match = await Match.create({
      activity: activityId,
      participants: [req.user.id, targetUserId],
    });
    await Activity.findByIdAndUpdate(activityId, { status: 'matched' });
    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({ participants: req.user.id })
      .populate('activity')
      .populate('participants', 'name email bio')
      .populate('itinerary');
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

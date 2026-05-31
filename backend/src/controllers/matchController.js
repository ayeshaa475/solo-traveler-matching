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
      city: { $regex: new RegExp(`^${activity.city}$`, 'i') },
      status: 'open',
      user: { $ne: activity.user._id },
    }).populate('user', 'name bio interests');

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
      .populate('participants', 'name email bio');
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const Feedback = require('../models/Feedback');

exports.submitFeedback = async (req, res) => {
  try {
    const existing = await Feedback.findOne({ match: req.body.matchId, submittedBy: req.user.id });
    if (existing) return res.status(409).json({ message: 'Feedback already submitted for this match' });

    const feedback = await Feedback.create({
      match: req.body.matchId,
      submittedBy: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
      itineraryUseful: req.body.itineraryUseful,
      wouldMeetAgain: req.body.wouldMeetAgain,
    });
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMatchFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ match: req.params.matchId })
      .populate('submittedBy', 'name');
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

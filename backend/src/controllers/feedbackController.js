const Feedback = require('../models/Feedback');
const Match = require('../models/Match');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { reviewFeedback } = require('../agents/safetyAgent');

const recalcTrustScore = (user) =>
  Math.min(100, Math.max(0,
    50 + user.completedMeetups * 10 + (user.averageRating - 3) * 5 - user.flagCount * 15
  ));

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

    // Update trust score for the rated user (the other participant)
    try {
      const match = await Match.findById(req.body.matchId);
      if (match) {
        const ratedUserId = match.participants.find((p) => String(p) !== String(req.user.id));
        if (ratedUserId) {
          const ratedUser = await User.findById(ratedUserId);
          if (ratedUser) {
            const newTotalRatings = ratedUser.totalRatings + 1;
            ratedUser.averageRating = (ratedUser.averageRating * ratedUser.totalRatings + req.body.rating) / newTotalRatings;
            ratedUser.totalRatings = newTotalRatings;
            ratedUser.completedMeetups += 1;
            ratedUser.trustScore = recalcTrustScore(ratedUser);
            await ratedUser.save();

            // Safety review for low ratings
            if (req.body.rating <= 2) {
              try {
                const classification = await reviewFeedback(req.body.comment || '', req.body.rating);
                console.log(`[feedbackController] safety classification for user ${ratedUserId}: ${classification}`);
                if (classification === 'harmful') {
                  ratedUser.flagCount += 1;
                  ratedUser.trustScore = recalcTrustScore(ratedUser);
                  await ratedUser.save();
                  await Notification.create({
                    recipient: ratedUser._id,
                    type: 'safety_flag',
                    message: 'Your account has been flagged following a recent meetup review. Please ensure you follow community guidelines.',
                  });
                }
              } catch (safetyErr) {
                console.error('[feedbackController] safety check error:', safetyErr.message);
              }
            }
          }
        }
      }
    } catch (trustErr) {
      console.error('[feedbackController] trust score update error:', trustErr.message);
    }

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

const router = require('express').Router();
const { submitFeedback, getMatchFeedback } = require('../controllers/feedbackController');
const auth = require('../middleware/auth');

router.post('/', auth, submitFeedback);
router.get('/:matchId', auth, getMatchFeedback);

module.exports = router;

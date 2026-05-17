const router = require('express').Router();
const { findMatches, createMatch, getMyMatches } = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.get('/my', auth, getMyMatches);
router.get('/find/:activityId', auth, findMatches);
router.post('/', auth, createMatch);

module.exports = router;

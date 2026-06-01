const router = require('express').Router();
const { findMatches, createMatch, getMyMatches, advanceStatus, deleteMatch } = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.get('/my', auth, getMyMatches);
router.get('/find/:activityId', auth, findMatches);
router.post('/', auth, createMatch);
router.patch('/:id/status', auth, advanceStatus);
router.delete('/:id', auth, deleteMatch);

module.exports = router;

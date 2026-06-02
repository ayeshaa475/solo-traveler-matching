const router = require('express').Router();
const { generateItinerary, getItinerary, proposeRevision, resolveRevision } = require('../controllers/itineraryController');
const auth = require('../middleware/auth');

router.post('/generate/:matchId', auth, generateItinerary);
router.get('/:id', auth, getItinerary);
router.post('/:id/propose', auth, proposeRevision);
router.patch('/:id/revision', auth, resolveRevision);

module.exports = router;

const router = require('express').Router();
const { generateItinerary, getItinerary } = require('../controllers/itineraryController');
const auth = require('../middleware/auth');

router.post('/generate/:matchId', auth, generateItinerary);
router.get('/:id', auth, getItinerary);

module.exports = router;

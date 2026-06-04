const router = require('express').Router();
const {
  createActivity,
  getActivities,
  getMyActivities,
  getActivity,
  deleteActivity,
  parseActivity,
  suggestActivity,
  proxyPhoto,
} = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.get('/', getActivities);
router.get('/mine', auth, getMyActivities);
router.get('/photo/:photoReference', proxyPhoto);
router.post('/parse', auth, parseActivity);
router.post('/suggest', auth, suggestActivity);
router.get('/:id', getActivity);
router.post('/', auth, createActivity);
router.delete('/:id', auth, deleteActivity);

module.exports = router;

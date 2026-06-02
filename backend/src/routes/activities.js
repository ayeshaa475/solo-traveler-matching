const router = require('express').Router();
const {
  createActivity,
  getActivities,
  getMyActivities,
  getActivity,
  deleteActivity,
  parseActivity,
  suggestActivity,
} = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.get('/', getActivities);
router.get('/mine', auth, getMyActivities);
router.post('/parse', auth, parseActivity);
router.post('/suggest', auth, suggestActivity);
router.get('/:id', getActivity);
router.post('/', auth, createActivity);
router.delete('/:id', auth, deleteActivity);

module.exports = router;

const router = require('express').Router();
const {
  createActivity,
  getActivities,
  getActivity,
  deleteActivity,
} = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.get('/', getActivities);
router.get('/:id', getActivity);
router.post('/', auth, createActivity);
router.delete('/:id', auth, deleteActivity);

module.exports = router;

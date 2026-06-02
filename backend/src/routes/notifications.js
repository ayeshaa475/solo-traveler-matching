const router = require('express').Router();
const { getNotifications, markOneRead, markAllRead } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.patch('/read-all', auth, markAllRead);
router.patch('/:id/read', auth, markOneRead);

module.exports = router;

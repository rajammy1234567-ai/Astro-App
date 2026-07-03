const express = require('express');
const ctrl = require('../controllers/astrologerApplicationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/apply', protect, ctrl.apply);
router.get('/my', protect, ctrl.getMyApplication);
router.get('/notifications', protect, ctrl.getNotifications);
router.put('/notifications/read-all', protect, ctrl.markAllNotificationsRead);
router.put('/notifications/:id/read', protect, ctrl.markNotificationRead);

module.exports = router;
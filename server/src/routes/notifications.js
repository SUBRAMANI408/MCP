const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  registerDeviceToken,
} = require('../controllers/notificationController');

router.use(authenticate);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/device-token', registerDeviceToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;

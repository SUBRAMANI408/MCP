const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createAssociation,
  getAssociations,
  updateAssociation,
  deleteAssociation,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  toggleUserStatus,
  resetUserPassword,
  getAuditLogs,
  getDashboardStats,
  sendAdminNotification
} = require('../controllers/adminController');

const { getAnalytics } = require('../controllers/analyticsController');
const {
  getConfig,
  updateConfig,
  getFeedback,
  replyToFeedback,
  resolveFeedback,
  forceLogoutUser,
  getLoginAttempts
} = require('../controllers/systemController');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardStats);

// Association management
router.post('/associations', [
  body('name').notEmpty().trim(),
  body('headUserId').optional().isMongoId(),
  body('headEmail').optional().isEmail().normalizeEmail(),
  body('headPassword').optional().isLength({ min: 6 }),
], validate, createAssociation);
router.get('/associations', getAssociations);
router.put('/associations/:id', updateAssociation);
router.delete('/associations/:id', deleteAssociation);

// User management (bulk delete & notifications must come before :id routes)
router.post('/users/bulk-delete', bulkDeleteUsers);
router.post('/users', [
  body('name').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['association_head', 'tournament_organizer', 'captain', 'vice_captain', 'ground_officer', 'funds_officer', 'player']),
], validate, createUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', toggleUserStatus);
router.post('/users/:id/reset-password', resetUserPassword);

// Notifications
router.post('/notifications/send', sendAdminNotification);

// Analytics
router.get('/analytics', getAnalytics);

// Audit
router.get('/audit-logs', getAuditLogs);

// System config
router.get('/system-config', getConfig);
router.put('/system-config', updateConfig);

// Feedback
router.get('/feedback', getFeedback);
router.put('/feedback/:id/reply', replyToFeedback);
router.patch('/feedback/:id/resolve', resolveFeedback);

// Security
router.post('/users/:id/force-logout', forceLogoutUser);
router.get('/security/login-attempts', getLoginAttempts);

module.exports = router;

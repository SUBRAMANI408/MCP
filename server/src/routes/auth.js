const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  login,
  register,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  updateProfile,
  refreshToken,
  logout,
  logoutAll
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Strictly scope brute-force limiter to credential submission endpoints, keyed on IP + normalized email
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.ip}_${(req.body?.email || '').toLowerCase()}`,
  message: { success: false, message: 'Too many authentication attempts for this account. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().isLength({ min: 6 }),
], validate, login);

router.post('/register', authLimiter, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], validate, register);

router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
], validate, refreshToken);

router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);

router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail(),
], validate, forgotPassword);

router.post('/reset-password', authLimiter, [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
], validate, resetPassword);

// Session and profile management endpoints are on the general limiter (no 10-req lockout on session checks)
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], validate, changePassword);

module.exports = router;

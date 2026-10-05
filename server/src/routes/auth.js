const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().isLength({ min: 6 }),
], validate, login);

router.post('/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], validate, register);

router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
], validate, refreshToken);

router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], validate, forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
], validate, resetPassword);

router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], validate, changePassword);

module.exports = router;

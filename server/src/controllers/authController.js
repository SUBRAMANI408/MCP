const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateResetToken } = require('../utils/generateToken');
const { sendEmail } = require('../config/email');
const { successResponse } = require('../utils/apiResponse');
const createNotification = require('../utils/createNotification');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || user.status === 'inactive') {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  const token = generateAccessToken(user._id, user.role, user.associationId, user.teamId);
  successResponse(res, { token, user: user.toJSON() }, 'Login successful');
};

exports.register = async (req, res) => {
  const { name, email, password, role, associationId, teamId, phone } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  const user = new User({
    name, email, passwordHash: password, role,
    associationId: associationId || null,
    teamId: teamId || null,
    phone: phone || null,
  });
  await user.save();
  const token = generateAccessToken(user._id, user.role, user.associationId, user.teamId);
  successResponse(res, { token, user: user.toJSON() }, 'User registered successfully', 201);
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }
  const { token, hashed } = generateResetToken();
  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset. Click the link below:</p>
           <a href="${resetUrl}">${resetUrl}</a>
           <p>This link expires in 1 hour.</p>`,
  });
  res.status(200).json({ success: true, message: 'Password reset email sent.' });
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }
  user.passwordHash = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.status(200).json({ success: true, message: 'Password reset successful' });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('associationId', 'name')
    .populate('teamId', 'name sport');
  successResponse(res, user);
};

exports.updateProfile = async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...(name && { name }), ...(phone !== undefined && { phone }), ...(avatar !== undefined && { avatar }) },
    { new: true }
  ).populate('associationId', 'name').populate('teamId', 'name sport');
  successResponse(res, user, 'Profile updated successfully');
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }
  user.passwordHash = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: 'Password changed successfully' });
};

const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const LoginAttempt = require('../models/LoginAttempt');
const { generateAccessToken, generateResetToken, generateRefreshToken } = require('../utils/generateToken');
const { sendEmail } = require('../config/email');
const { successResponse } = require('../utils/apiResponse');
const createNotification = require('../utils/createNotification');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    await LoginAttempt.create({ email, success: false, ip, userAgent, reason: 'User not found' });
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Check account lockout
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    await LoginAttempt.create({ email, userId: user._id, success: false, ip, userAgent, reason: 'Account locked' });
    return res.status(403).json({
      success: false,
      message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minute(s).`
    });
  }

  // Check account status
  if (user.status === 'inactive' || user.status === 'suspended') {
    await LoginAttempt.create({ email, userId: user._id, success: false, ip, userAgent, reason: `Account ${user.status}` });
    return res.status(403).json({ success: false, message: `Account is ${user.status}. Contact your administrator.` });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    let locked = false;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      locked = true;
    }
    await user.save({ validateBeforeSave: false });

    await LoginAttempt.create({
      email,
      userId: user._id,
      success: false,
      ip,
      userAgent,
      reason: locked ? 'Account locked after 5 failed attempts' : 'Incorrect password'
    });

    if (locked) {
      return res.status(403).json({
        success: false,
        message: 'Account locked due to 5 consecutive failed login attempts. Locked for 15 minutes.'
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Successful login: reset attempts and record lastLogin
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await LoginAttempt.create({ email, userId: user._id, success: true, ip, userAgent });

  const token = generateAccessToken(user._id, user.role, user.associationId, user.teamId);
  const refreshToken = await generateRefreshToken(user._id, ip, userAgent);

  successResponse(res, { token, refreshToken, user: user.toJSON() }, 'Login successful');
};

exports.register = async (req, res) => {
  const { name, email, password, associationId, teamId, phone } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  const user = new User({
    name, email, passwordHash: password, role: 'player',
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

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const ip = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required' });
  }

  const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
  if (!tokenDoc || !tokenDoc.isValid()) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user || user.status === 'inactive' || user.status === 'suspended') {
    return res.status(401).json({ success: false, message: 'User account inactive or suspended' });
  }

  // Token rotation: revoke old, issue new
  tokenDoc.revokedAt = new Date();
  const newRefreshToken = await generateRefreshToken(user._id, ip, userAgent);
  tokenDoc.replacedByToken = newRefreshToken;
  await tokenDoc.save();

  const newAccessToken = generateAccessToken(user._id, user.role, user.associationId, user.teamId);

  successResponse(res, {
    token: newAccessToken,
    refreshToken: newRefreshToken,
  }, 'Token refreshed successfully');
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revokedAt: new Date() }
    );
  }
  successResponse(res, null, 'Logged out successfully');
};

exports.logoutAll = async (req, res) => {
  await RefreshToken.updateMany(
    { userId: req.user._id, revokedAt: null },
    { revokedAt: new Date() }
  );
  successResponse(res, null, 'Logged out from all devices');
};

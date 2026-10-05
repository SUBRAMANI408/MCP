const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (id, role, associationId, teamId) => {
  return jwt.sign(
    { id, role, associationId, teamId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashed };
};

const generateRefreshToken = async (userId, ip = '', userAgent = '') => {
  const RefreshToken = require('../models/RefreshToken');
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await RefreshToken.create({
    token,
    userId,
    ip,
    userAgent,
    expiresAt,
  });
  return token;
};

module.exports = { generateAccessToken, generateResetToken, generateRefreshToken };

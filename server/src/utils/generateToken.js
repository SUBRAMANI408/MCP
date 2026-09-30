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

module.exports = { generateAccessToken, generateResetToken };

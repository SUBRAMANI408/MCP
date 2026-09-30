const User = require('../models/User');
const { successResponse } = require('../utils/apiResponse');

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('associationId', 'name logo')
    .populate('teamId', 'name sport logo status');
  successResponse(res, user);
};

exports.updateProfile = async (req, res) => {
  const { name, phone, avatar } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (avatar !== undefined) updateData.avatar = avatar;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).populate('associationId', 'name').populate('teamId', 'name sport');
  successResponse(res, user, 'Profile updated');
};

exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('associationId', 'name')
    .populate('teamId', 'name sport');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  successResponse(res, user);
};

exports.getUsers = async (req, res) => {
  const { role, teamId, limit = 100 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (teamId === 'none') {
    query.teamId = null;
  } else if (teamId) {
    query.teamId = teamId;
  }
  const users = await User.find(query).select('name email role teamId avatar').limit(Number(limit));
  successResponse(res, users);
};

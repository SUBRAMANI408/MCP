const Ground = require('../models/Ground');
const Association = require('../models/Association');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.createGround = async (req, res) => {
  const { associationId, name, location, sportsSupported, capacity } = req.body;
  const ground = await Ground.create({ associationId, name, location, sportsSupported, capacity });
  await Association.findByIdAndUpdate(associationId, { $push: { grounds: ground._id } });
  successResponse(res, ground, 'Ground created', 201);
};

exports.getGrounds = async (req, res) => {
  const { associationId, status, page = 1, limit = 10 } = req.query;
  const query = {};
  if (associationId) query.associationId = associationId;
  if (status) query.status = status;
  const total = await Ground.countDocuments(query);
  const grounds = await Ground.find(query)
    .populate('associationId', 'name')
    .skip((page - 1) * limit).limit(Number(limit));
  paginatedResponse(res, grounds, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getGround = async (req, res) => {
  const ground = await Ground.findById(req.params.id).populate('associationId', 'name');
  if (!ground) return res.status(404).json({ success: false, message: 'Ground not found' });
  successResponse(res, ground);
};

exports.updateGround = async (req, res) => {
  const ground = await Ground.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!ground) return res.status(404).json({ success: false, message: 'Ground not found' });
  successResponse(res, ground, 'Ground updated');
};

exports.deleteGround = async (req, res) => {
  const ground = await Ground.findByIdAndDelete(req.params.id);
  if (!ground) return res.status(404).json({ success: false, message: 'Ground not found' });
  await Association.findByIdAndUpdate(ground.associationId, { $pull: { grounds: ground._id } });
  successResponse(res, null, 'Ground deleted');
};

exports.toggleGroundBooking = async (req, res) => {
  const ground = await Ground.findById(req.params.id);
  if (!ground) return res.status(404).json({ success: false, message: 'Ground not found' });
  ground.bookingEnabled = !ground.bookingEnabled;
  await ground.save();
  successResponse(res, ground, `Ground booking ${ground.bookingEnabled ? 'enabled' : 'disabled'}`);
};

exports.updateGroundStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'maintenance', 'unavailable'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }
  const ground = await Ground.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!ground) return res.status(404).json({ success: false, message: 'Ground not found' });
  successResponse(res, ground, `Ground status updated to ${status}`);
};

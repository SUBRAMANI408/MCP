const Sport = require('../models/Sport');
const { successResponse } = require('../utils/apiResponse');

exports.createSport = async (req, res) => {
  const { name, scoringSchema, icon } = req.body;
  const sport = await Sport.create({ name, scoringSchema, icon });
  successResponse(res, sport, 'Sport created', 201);
};

exports.getSports = async (req, res) => {
  const { isActive } = req.query;
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  const sports = await Sport.find(query).sort({ name: 1 });
  successResponse(res, sports);
};

exports.getSport = async (req, res) => {
  const sport = await Sport.findById(req.params.id);
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  successResponse(res, sport);
};

exports.updateSport = async (req, res) => {
  const sport = await Sport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  successResponse(res, sport, 'Sport updated');
};

exports.deleteSport = async (req, res) => {
  const sport = await Sport.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  successResponse(res, null, 'Sport deactivated');
};

exports.toggleSport = async (req, res) => {
  const sport = await Sport.findById(req.params.id);
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  sport.isActive = !sport.isActive;
  await sport.save();
  successResponse(res, sport, `Sport ${sport.isActive ? 'activated' : 'deactivated'}`);
};

exports.hardDeleteSport = async (req, res) => {
  const sport = await Sport.findByIdAndDelete(req.params.id);
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  successResponse(res, null, 'Sport permanently deleted');
};

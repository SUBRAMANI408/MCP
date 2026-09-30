const Fixture = require('../models/Fixture');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getFixtures = async (req, res) => {
  const { tournamentId, status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (tournamentId) query.tournamentId = tournamentId;
  if (status) query.status = status;
  const total = await Fixture.countDocuments(query);
  const fixtures = await Fixture.find(query)
    .populate('teamA', 'name sport')
    .populate('teamB', 'name sport')
    .populate('groundId', 'name location')
    .populate('tournamentId', 'name sport')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ round: 1, scheduledDate: 1 });
  paginatedResponse(res, fixtures, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getFixture = async (req, res) => {
  const fixture = await Fixture.findById(req.params.id)
    .populate('teamA', 'name sport captainId players')
    .populate('teamB', 'name sport captainId players')
    .populate('groundId', 'name location')
    .populate('tournamentId', 'name sport format')
    .populate('matchId');
  if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });
  successResponse(res, fixture);
};

exports.scheduleFixture = async (req, res) => {
  const { groundId, scheduledDate, scheduledTime } = req.body;
  const fixture = await Fixture.findByIdAndUpdate(
    req.params.id,
    { groundId, scheduledDate, scheduledTime, status: 'scheduled' },
    { new: true }
  ).populate('teamA teamB', 'name').populate('groundId', 'name');
  if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });
  successResponse(res, fixture, 'Fixture scheduled');
};

exports.updateFixture = async (req, res) => {
  const fixture = await Fixture.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });
  successResponse(res, fixture, 'Fixture updated');
};

const Match = require('../models/Match');
const Fixture = require('../models/Fixture');
const FriendlyMatch = require('../models/FriendlyMatch');
const Team = require('../models/Team');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getMatches = async (req, res) => {
  const { status, type, teamId, page = 1, limit = 10 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  if (teamId) query.$or = [{ teamA: teamId }, { teamB: teamId }];
  const total = await Match.countDocuments(query);
  const matches = await Match.find(query)
    .populate('teamA', 'name sport')
    .populate('teamB', 'name sport')
    .populate('groundId', 'name location')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, matches, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getLiveMatches = async (req, res) => {
  const matches = await Match.find({ status: 'live' })
    .populate('teamA', 'name sport logo')
    .populate('teamB', 'name sport logo')
    .populate('groundId', 'name location');
  successResponse(res, matches);
};

exports.getMatch = async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('teamA', 'name sport logo captainId')
    .populate('teamB', 'name sport logo captainId')
    .populate('groundId', 'name location')
    .populate('scorerId', 'name');
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  successResponse(res, match);
};

exports.getMatchSummary = async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('teamA', 'name sport logo')
    .populate('teamB', 'name sport logo')
    .populate('groundId', 'name');
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  successResponse(res, { match, events: match.events, scoreSummary: match.scoreSummary });
};

exports.startMatch = async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  if (match.status === 'live') return res.status(400).json({ success: false, message: 'Match already live' });
  match.status = 'live';
  match.startedAt = new Date();
  match.scorerId = req.user._id;
  await match.save();
  const io = req.app.get('io');
  io.emit('match:update', { matchId: match._id, status: 'live', scoreSummary: match.scoreSummary });
  successResponse(res, match, 'Match started');
};

exports.addMatchEvent = async (req, res) => {
  const { type, teamId, playerId, data } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Match is not live' });
  const event = { timestamp: new Date(), type, teamId, playerId, data };
  match.events.push(event);
  // Update score summary
  if (data && data.scoreSummary) {
    match.scoreSummary = { ...match.scoreSummary, ...data.scoreSummary };
  } else if (data && data.score) {
    const teamKey = teamId?.toString() === match.teamA?.toString() ? 'teamA' : 'teamB';
    match.scoreSummary = {
      ...match.scoreSummary,
      [teamKey]: (match.scoreSummary[teamKey] || 0) + (data.score || 0),
    };
  }
  match.markModified('scoreSummary');
  await match.save();
  const io = req.app.get('io');
  io.to(`match:${match._id}`).emit('match:update', {
    matchId: match._id,
    event,
    scoreSummary: match.scoreSummary,
  });
  successResponse(res, { event, scoreSummary: match.scoreSummary });
};

exports.completeMatch = async (req, res) => {
  const { finalScore } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  match.status = 'completed';
  match.endedAt = new Date();
  if (finalScore) match.scoreSummary = finalScore;
  await match.save();
  // Increment matchesPlayed for both teams
  await Team.updateMany(
    { _id: { $in: [match.teamA, match.teamB] } },
    { $inc: { matchesPlayed: 1 } }
  );
  // Update fixture/friendly match status
  if (match.type === 'tournament') {
    await Fixture.findByIdAndUpdate(match.refId, { status: 'completed', matchId: match._id });
  } else {
    await FriendlyMatch.findByIdAndUpdate(match.refId, { status: 'accepted' });
  }
  const io = req.app.get('io');
  io.to(`match:${match._id}`).emit('match:update', { matchId: match._id, status: 'completed', scoreSummary: match.scoreSummary });
  successResponse(res, match, 'Match completed');
};

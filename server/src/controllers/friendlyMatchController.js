const FriendlyMatch = require('../models/FriendlyMatch');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.sendFriendlyRequest = async (req, res) => {
  const { respondingTeamId, sport, groundId, date, time, message } = req.body;
  const requestingTeam = await Team.findById(req.user.teamId);
  if (!requestingTeam) return res.status(400).json({ success: false, message: 'You are not in a team' });
  const respondingTeam = await Team.findById(respondingTeamId);
  if (!respondingTeam) return res.status(404).json({ success: false, message: 'Responding team not found' });

  if (req.user.role !== 'admin') {
    const reqAssoc = requestingTeam.associationId?.toString();
    const respAssoc = respondingTeam.associationId?.toString();
    if (reqAssoc && respAssoc && reqAssoc !== respAssoc) {
      return res.status(403).json({ success: false, message: 'Cross-association friendly match requests are not permitted' });
    }
  }

  const match = await FriendlyMatch.create({
    requestingTeamId: req.user.teamId,
    respondingTeamId, sport, groundId, date, time, message, status: 'pending',
  });
  await Notification.create({
    userId: respondingTeam.captainId,
    type: 'friendly_request',
    message: `${requestingTeam.name} has sent you a friendly match request.`,
    refId: match._id,
    refModel: 'FriendlyMatch',
  });
  const io = req.app.get('io');
  io.to(respondingTeam.captainId.toString()).emit('notification:new', { type: 'friendly_request', matchId: match._id });
  successResponse(res, match, 'Friendly match request sent', 201);
};

exports.getFriendlyMatches = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const teamId = req.user.teamId;
  const query = {
    $or: [{ requestingTeamId: teamId }, { respondingTeamId: teamId }]
  };
  if (status) query.status = status;
  const total = await FriendlyMatch.countDocuments(query);
  const matches = await FriendlyMatch.find(query)
    .populate('requestingTeamId', 'name sport')
    .populate('respondingTeamId', 'name sport')
    .populate('groundId', 'name location')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, matches, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getFriendlyMatch = async (req, res) => {
  const match = await FriendlyMatch.findById(req.params.id)
    .populate('requestingTeamId', 'name sport captainId associationId')
    .populate('respondingTeamId', 'name sport captainId associationId')
    .populate('groundId', 'name location');
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

  if (req.user.role !== 'admin') {
    const userTeamId = req.user.teamId?.toString();
    const reqTeamId = match.requestingTeamId?._id?.toString() || match.requestingTeamId?.toString();
    const respTeamId = match.respondingTeamId?._id?.toString() || match.respondingTeamId?.toString();
    if (userTeamId !== reqTeamId && userTeamId !== respTeamId) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not belong to either team in this friendly match' });
    }
  }

  successResponse(res, match);
};

exports.acceptFriendlyMatch = async (req, res) => {
  const match = await FriendlyMatch.findById(req.params.id)
    .populate('requestingTeamId', 'captainId name')
    .populate('respondingTeamId', 'captainId name');
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  if (match.respondingTeamId.captainId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only responding team captain can accept' });
  }
  match.status = 'accepted';
  await match.save();

  // Communication: Auto-create dedicated match group chat (Phase 8)
  const Group = require('../models/Group');
  await Group.findOneAndUpdate(
    { type: 'friendly', refId: match._id },
    {
      type: 'friendly',
      refId: match._id,
      name: `${match.requestingTeamId.name} vs ${match.respondingTeamId.name} (Friendly)`,
      members: [match.requestingTeamId.captainId, match.respondingTeamId.captainId],
      adminIds: [match.requestingTeamId.captainId, match.respondingTeamId.captainId],
    },
    { upsert: true, new: true }
  );

  await Notification.create({
    userId: match.requestingTeamId.captainId,
    type: 'friendly_accepted',
    message: `${match.respondingTeamId.name} accepted your friendly match request! A shared chat has been created.`,
    refId: match._id,
  });
  const io = req.app.get('io');
  if (io) io.to(match.requestingTeamId.captainId.toString()).emit('notification:new', { type: 'friendly_accepted', matchId: match._id });
  successResponse(res, match, 'Friendly match accepted and chat room created');
};

exports.rejectFriendlyMatch = async (req, res) => {
  const match = await FriendlyMatch.findById(req.params.id)
    .populate('requestingTeamId', 'captainId name')
    .populate('respondingTeamId', 'name');
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  match.status = 'rejected';
  await match.save();
  await Notification.create({
    userId: match.requestingTeamId.captainId,
    type: 'friendly_rejected',
    message: `${match.respondingTeamId.name} rejected your friendly match request.`,
    refId: match._id,
  });
  successResponse(res, match, 'Friendly match rejected');
};

exports.cancelFriendlyMatch = async (req, res) => {
  const match = await FriendlyMatch.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  if (match.requestingTeamId.toString() !== req.user.teamId?.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  match.status = 'cancelled';
  await match.save();
  successResponse(res, match, 'Match cancelled');
};

exports.rescheduleFriendlyMatch = async (req, res) => {
  const { date, time, groundId } = req.body;
  const match = await FriendlyMatch.findById(req.params.id)
    .populate('requestingTeamId', 'captainId name')
    .populate('respondingTeamId', 'captainId name');
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

  // Verify requester is one of the captains
  const isRequestingCaptain = match.requestingTeamId.captainId.toString() === req.user._id.toString();
  const isRespondingCaptain = match.respondingTeamId.captainId.toString() === req.user._id.toString();
  if (!isRequestingCaptain && !isRespondingCaptain) {
    return res.status(403).json({ success: false, message: 'Only team captains can reschedule friendly matches' });
  }

  match.date = date || match.date;
  match.time = time || match.time;
  match.groundId = groundId || match.groundId;
  match.status = 'pending';
  await match.save();

  // Notify the other captain
  const otherCaptainId = isRequestingCaptain ? match.respondingTeamId.captainId : match.requestingTeamId.captainId;
  const actingTeamName = isRequestingCaptain ? match.requestingTeamId.name : match.respondingTeamId.name;
  await Notification.create({
    userId: otherCaptainId,
    type: 'general',
    message: `${actingTeamName} has rescheduled the friendly match request. Please review details.`,
    refId: match._id,
  });

  successResponse(res, match, 'Friendly match rescheduled, pending approval from other team');
};

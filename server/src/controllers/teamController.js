const Team = require('../models/Team');
const User = require('../models/User');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.createTeam = async (req, res) => {
  const { name, sport, associationId } = req.body;
  const existingTeam = await Team.findOne({ name, associationId });
  if (existingTeam) return res.status(400).json({ success: false, message: 'Team name already exists in this association' });
  const team = await Team.create({
    name, sport, associationId,
    captainId: req.user._id,
    players: [req.user._id],
    status: 'pending',
  });
  // Update captain's teamId
  await User.findByIdAndUpdate(req.user._id, { teamId: team._id });
  
  // Create team group chat automatically
  await Group.create({
    type: 'team',
    refId: team._id,
    name: `${team.name} Group`,
    members: [req.user._id],
    adminIds: [req.user._id],
  });

  successResponse(res, team, 'Team created', 201);
};

exports.getTeam = async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('captainId', 'name email phone avatar')
    .populate('viceCaptainId', 'name email avatar')
    .populate('players', 'name email avatar role')
    .populate('associationId', 'name');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  successResponse(res, team);
};

exports.updateTeam = async (req, res) => {
  const { name, sport, logo, description, viceCaptainId } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (sport !== undefined) updateData.sport = sport;
  if (logo !== undefined) updateData.logo = logo;
  if (description !== undefined) updateData.description = description;
  if (viceCaptainId !== undefined) updateData.viceCaptainId = viceCaptainId || null;
  const team = await Team.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  successResponse(res, team, 'Team updated');
};

exports.invitePlayer = async (req, res) => {
  const { userId, message } = req.body;
  const Invitation = require('../models/Invitation');
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  if (team.players.includes(userId)) return res.status(400).json({ success: false, message: 'Player already in team' });

  // Check if an active invitation already exists
  const existing = await Invitation.findOne({ teamId: team._id, playerId: userId, status: 'pending' });
  if (existing) return res.status(400).json({ success: false, message: 'An invite is already pending for this player' });

  const invite = await Invitation.create({
    teamId: team._id,
    playerId: userId,
    invitedById: req.user._id,
    message: message || '',
    status: 'pending',
  });

  await Notification.create({
    userId,
    type: 'team_invite',
    message: `You have been invited to join team "${team.name}" by captain ${req.user.name}`,
    refId: invite._id,
    refModel: 'Invitation',
  });

  const io = req.app.get('io');
  io.to(userId.toString()).emit('notification:new', { type: 'team_invite', inviteId: invite._id, teamName: team.name });
  successResponse(res, invite, 'Invitation sent to player', 201);
};

exports.removePlayer = async (req, res) => {
  const { playerId } = req.params;
  const team = await Team.findByIdAndUpdate(
    req.params.id,
    { $pull: { players: playerId } },
    { new: true }
  );
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  await User.findByIdAndUpdate(playerId, { teamId: null });
  await Group.findOneAndUpdate({ type: 'team', refId: team._id }, { $pull: { members: playerId } });
  successResponse(res, team, 'Player removed from team');
};

exports.promoteViceCaptain = async (req, res) => {
  const { playerId } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  if (!team.players.map(p => p.toString()).includes(playerId)) {
    return res.status(400).json({ success: false, message: 'Player not in team' });
  }
  // Demote previous vice captain
  if (team.viceCaptainId) {
    await User.findByIdAndUpdate(team.viceCaptainId, { role: 'player' });
  }
  team.viceCaptainId = playerId;
  await team.save();
  await User.findByIdAndUpdate(playerId, { role: 'vice_captain' });
  await Notification.create({
    userId: playerId,
    type: 'general',
    message: `You have been promoted to Vice Captain of "${team.name}"`,
    refId: team._id,
    refModel: 'Team',
  });
  successResponse(res, team, 'Vice captain promoted');
};

exports.getTeamsByAssociation = async (req, res) => {
  const { associationId, status, sport, page = 1, limit = 10 } = req.query;
  const query = {};
  if (associationId) query.associationId = associationId;
  if (status) query.status = status;
  if (sport) query.sport = sport;
  const total = await Team.countDocuments(query);
  const teams = await Team.find(query)
    .populate('captainId', 'name email')
    .populate('associationId', 'name')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, teams, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getMyTeam = async (req, res) => {
  if (!req.user.teamId) return res.status(404).json({ success: false, message: 'You are not in any team' });
  const team = await Team.findById(req.user.teamId)
    .populate('captainId', 'name email phone avatar')
    .populate('viceCaptainId', 'name email avatar')
    .populate('players', 'name email avatar role')
    .populate('associationId', 'name');
  successResponse(res, team);
};

exports.submitForApproval = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  if (team.captainId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only captain can submit for approval' });
  }
  team.status = 'pending';
  await team.save();
  successResponse(res, team, 'Team submitted for approval');
};

exports.getMyInvitations = async (req, res) => {
  const Invitation = require('../models/Invitation');
  const invites = await Invitation.find({ playerId: req.user._id, status: 'pending' })
    .populate('teamId', 'name sport logo')
    .populate('invitedById', 'name email');
  successResponse(res, invites);
};

exports.acceptInvitation = async (req, res) => {
  const Invitation = require('../models/Invitation');
  const invite = await Invitation.findById(req.params.inviteId);
  if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found' });
  if (invite.playerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  invite.status = 'accepted';
  await invite.save();

  const team = await Team.findById(invite.teamId);
  if (team) {
    if (!team.players.includes(req.user._id)) {
      team.players.push(req.user._id);
      await team.save();
    }
    // Update player teamId & role
    await User.findByIdAndUpdate(req.user._id, { teamId: team._id, role: 'player' });

    // Join team group chat if it exists, or create it if missing
    let teamGroup = await Group.findOne({ type: 'team', refId: team._id });
    if (!teamGroup) {
      teamGroup = await Group.create({
        type: 'team',
        refId: team._id,
        name: `${team.name} Group`,
        members: [team.captainId, req.user._id],
        adminIds: [team.captainId],
      });
    } else {
      await Group.findOneAndUpdate({ type: 'team', refId: team._id }, { $addToSet: { members: req.user._id } });
    }

    // Send notification to Captain
    await Notification.create({
      userId: team.captainId,
      type: 'team_invite_response',
      message: `${req.user.name} has accepted your invitation to join ${team.name}`,
      refId: team._id,
      refModel: 'Team',
    });

    const io = req.app.get('io');
    io.to(team.captainId.toString()).emit('notification:new', { type: 'team_invite_response', teamId: team._id });
  }

  successResponse(res, invite, 'Invitation accepted successfully');
};

exports.rejectInvitation = async (req, res) => {
  const Invitation = require('../models/Invitation');
  const invite = await Invitation.findById(req.params.inviteId);
  if (!invite) return res.status(404).json({ success: false, message: 'Invitation not found' });
  if (invite.playerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  invite.status = 'rejected';
  await invite.save();

  const team = await Team.findById(invite.teamId);
  if (team) {
    await Notification.create({
      userId: team.captainId,
      type: 'team_invite_response',
      message: `${req.user.name} has rejected your invitation to join ${team.name}`,
      refId: team._id,
      refModel: 'Team',
    });

    const io = req.app.get('io');
    io.to(team.captainId.toString()).emit('notification:new', { type: 'team_invite_response', teamId: team._id });
  }

  successResponse(res, invite, 'Invitation rejected successfully');
};

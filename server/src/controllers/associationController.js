const Association = require('../models/Association');
const User = require('../models/User');
const Team = require('../models/Team');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const Tournament = require('../models/Tournament');
const Ground = require('../models/Ground');
const Booking = require('../models/Booking');
const Fund = require('../models/Fund');
const Match = require('../models/Match');
const FriendlyMatch = require('../models/FriendlyMatch');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { logAudit } = require('../utils/auditLogger');

exports.getAssociation = async (req, res) => {
  const association = await Association.findById(req.params.id)
    .populate('headUserId', 'name email phone')
    .populate('grounds', 'name location status sportsSupported capacity description bookingEnabled');
  if (!association) return res.status(404).json({ success: false, message: 'Association not found' });
  successResponse(res, association);
};

exports.updateAssociation = async (req, res) => {
  const association = await Association.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!association) return res.status(404).json({ success: false, message: 'Association not found' });
  successResponse(res, association, 'Association updated');
};

exports.getAssociationDashboard = async (req, res) => {
  const { id } = req.params;
  const assocId = require('mongoose').Types.ObjectId.createFromHexString(id);

  // Get list of ground IDs of this association to scope bookings/matches
  const grounds = await Ground.find({ associationId: id }, '_id');
  const groundIds = grounds.map(g => g._id);

  // Get list of team IDs of this association
  const teamsList = await Team.find({ associationId: id }, '_id');
  const teamIds = teamsList.map(t => t._id);

  const [
    totalTeams, pendingTeamApprovals, activeTeams,
    totalCaptains, totalViceCaptains, totalPlayers, activePlayers,
    totalOrganizers, totalGroundOfficers, totalFundsOfficers,
    totalGroundsUsed, totalTournaments, upcomingTournaments,
    ongoingTournaments, completedTournaments, totalGroundBookings,
    revenueRes, expenseRes, liveMatches, friendlyMatches
  ] = await Promise.all([
    Team.countDocuments({ associationId: id }),
    Team.countDocuments({ associationId: id, status: 'pending' }),
    Team.countDocuments({ associationId: id, status: 'approved' }),
    User.countDocuments({ associationId: id, role: 'captain' }),
    User.countDocuments({ associationId: id, role: 'vice_captain' }),
    User.countDocuments({ associationId: id, role: 'player' }),
    User.countDocuments({ associationId: id, role: 'player', status: 'active' }),
    User.countDocuments({ associationId: id, role: 'tournament_organizer' }),
    User.countDocuments({ associationId: id, role: 'ground_officer' }),
    User.countDocuments({ associationId: id, role: 'funds_officer' }),
    Ground.countDocuments({ associationId: id }),
    Tournament.countDocuments({ associationId: id }),
    Tournament.countDocuments({ associationId: id, status: 'approved' }),
    Tournament.countDocuments({ associationId: id, status: 'ongoing' }),
    Tournament.countDocuments({ associationId: id, status: 'completed' }),
    Booking.countDocuments({ groundId: { $in: groundIds } }),
    Fund.aggregate([{ $match: { associationId: assocId, type: 'income', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Fund.aggregate([{ $match: { associationId: assocId, type: 'expense', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Match.countDocuments({ status: 'live', groundId: { $in: groundIds } }),
    FriendlyMatch.countDocuments({ $or: [{ requestingTeamId: { $in: teamIds } }, { respondingTeamId: { $in: teamIds } }] }),
  ]);

  const totalRevenue = revenueRes[0]?.total || 0;
  const totalExpenses = expenseRes[0]?.total || 0;
  const fundBalance = totalRevenue - totalExpenses;

  successResponse(res, {
    totalTeams,
    pendingTeamApprovals,
    activeTeams,
    totalCaptains,
    totalViceCaptains,
    totalPlayers,
    activePlayers,
    totalOrganizers,
    totalGroundOfficers,
    totalFundsOfficers,
    totalGroundsUsed,
    totalTournaments,
    upcomingTournaments,
    ongoingTournaments,
    completedTournaments,
    totalGroundBookings,
    totalRevenue,
    totalExpenses,
    fundBalance,
    liveMatches,
    friendlyMatches
  });
};

exports.createOrganizer = async (req, res) => {
  const { name, email, password, phone, username } = req.body;
  const { id: associationId } = req.params;
  const user = await User.create({
    name, email, passwordHash: password || 'Organizer@123',
    role: 'tournament_organizer', associationId, phone, username: username || null,
    status: 'active'
  });
  await Group.findOneAndUpdate({ type: 'association', refId: associationId }, { $addToSet: { members: user._id } });
  successResponse(res, user.toJSON(), 'Tournament organizer created', 201);
};

exports.createGroundOfficer = async (req, res) => {
  const { name, email, password, phone, username } = req.body;
  const { id: associationId } = req.params;
  const user = await User.create({
    name, email, passwordHash: password || 'Officer@123',
    role: 'ground_officer', associationId, phone, username: username || null,
    status: 'active'
  });
  await Group.findOneAndUpdate({ type: 'association', refId: associationId }, { $addToSet: { members: user._id } });
  successResponse(res, user.toJSON(), 'Ground booking officer created', 201);
};

exports.createFundsOfficer = async (req, res) => {
  const { name, email, password, phone, username } = req.body;
  const { id: associationId } = req.params;
  const user = await User.create({
    name, email, passwordHash: password || 'Funds@123',
    role: 'funds_officer', associationId, phone, username: username || null,
    status: 'active'
  });
  await Group.findOneAndUpdate({ type: 'association', refId: associationId }, { $addToSet: { members: user._id } });
  successResponse(res, user.toJSON(), 'Funds officer created', 201);
};

exports.updateOfficer = async (req, res) => {
  const { name, email, password, phone, username, role, status } = req.body;
  const officer = await User.findById(req.params.officerId);
  if (!officer || officer.associationId?.toString() !== req.params.id) {
    return res.status(404).json({ success: false, message: 'Officer not found in this association' });
  }

  officer.name = name !== undefined ? name : officer.name;
  officer.email = email !== undefined ? email : officer.email;
  officer.phone = phone !== undefined ? phone : officer.phone;
  officer.username = username !== undefined ? username : officer.username;
  officer.role = role !== undefined ? role : officer.role;
  officer.status = status !== undefined ? status : officer.status;

  if (password) {
    officer.passwordHash = password; // pre-save hook will hash it
  }

  await officer.save();
  successResponse(res, officer.toJSON(), 'Officer details updated successfully');
};

exports.deleteOfficer = async (req, res) => {
  const officer = await User.findOne({ _id: req.params.officerId, associationId: req.params.id });
  if (!officer) return res.status(404).json({ success: false, message: 'Officer not found in this association' });

  await officer.deleteOne();
  await Group.findOneAndUpdate({ type: 'association', refId: req.params.id }, { $pull: { members: req.params.officerId } });

  successResponse(res, null, 'Officer removed successfully');
};

exports.assignTemporaryOrganizer = async (req, res) => {
  const { captainId, assignedDate, startTime, endTime, reason } = req.body;
  
  const captain = await User.findOne({ _id: captainId, associationId: req.params.id, role: 'captain' });
  if (!captain) {
    return res.status(404).json({ success: false, message: 'Active Team Captain not found in this association' });
  }

  captain.tempOrganizer = {
    isTemp: true,
    assignedDate: assignedDate || new Date(),
    startTime: startTime || '09:00',
    endTime: endTime || '17:00',
    reason: reason || 'Temporary assignment',
    status: 'active'
  };

  await captain.save();

  // Notify captain
  await Notification.create({
    userId: captain._id,
    type: 'general',
    message: `You have been temporarily assigned as a Tournament Organizer until ${endTime}`,
  });

  successResponse(res, captain.toJSON(), 'Temporary Tournament Organizer role assigned successfully');
};

exports.revokeTemporaryOrganizer = async (req, res) => {
  const captain = await User.findOne({ _id: req.params.captainId, associationId: req.params.id });
  if (!captain) return res.status(404).json({ success: false, message: 'Captain not found' });

  captain.tempOrganizer = {
    isTemp: false,
    assignedDate: null,
    startTime: null,
    endTime: null,
    reason: null,
    status: 'revoked'
  };

  await captain.save();
  successResponse(res, captain.toJSON(), 'Temporary role revoked successfully');
};

exports.getAssociationTeams = async (req, res) => {
  const { id } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const query = { associationId: id };
  if (status) query.status = status;
  const total = await Team.countDocuments(query);
  const teams = await Team.find(query)
    .populate('captainId', 'name email phone')
    .populate('viceCaptainId', 'name')
    .populate('players', 'name email phone status')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, teams, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getAssociationMembers = async (req, res) => {
  const { id } = req.params;
  const members = await User.find({ associationId: id }, 'name email role status phone username tempOrganizer');
  successResponse(res, members);
};

exports.approveTeam = async (req, res) => {
  const team = await Team.findByIdAndUpdate(req.params.teamId, { status: 'approved', rejectionReason: null }, { new: true });
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  
  // Rule: Add ONLY the captain to the association group; players never join it
  await Group.findOneAndUpdate(
    { type: 'association', refId: team.associationId },
    { $addToSet: { members: team.captainId } }
  );

  const existingGroup = await Group.findOne({ type: 'team', refId: team._id });
  if (!existingGroup) {
    await Group.create({
      type: 'team', refId: team._id, name: `${team.name} Team Chat`,
      members: [team.captainId, ...(team.viceCaptainId ? [team.viceCaptainId] : []), ...team.players]
    });
  }

  await logAudit({
    action: 'team_approved',
    performedBy: req.user._id,
    targetModel: 'Team',
    targetId: team._id,
    details: { teamName: team.name }
  });

  await Notification.create({
    userId: team.captainId,
    type: 'team_approved',
    message: `Your team "${team.name}" has been approved!`,
    refId: team._id,
    refModel: 'Team',
  });

  const io = req.app.get('io');
  if (io) {
    io.to(team.captainId.toString()).emit('notification:new', { type: 'team_approved', teamId: team._id });
  }
  successResponse(res, team, 'Team approved');
};

exports.rejectTeam = async (req, res) => {
  const { reason } = req.body;
  const team = await Team.findByIdAndUpdate(
    req.params.teamId,
    { status: 'rejected', rejectionReason: reason },
    { new: true }
  );
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  await logAudit({
    action: 'team_rejected',
    performedBy: req.user._id,
    targetModel: 'Team',
    targetId: team._id,
    details: { reason }
  });

  await Notification.create({
    userId: team.captainId,
    type: 'team_rejected',
    message: `Your team "${team.name}" was rejected. Reason: ${reason || 'No reason provided'}`,
    refId: team._id,
    refModel: 'Team',
  });

  const io = req.app.get('io');
  if (io) {
    io.to(team.captainId.toString()).emit('notification:new', { type: 'team_rejected', teamId: team._id });
  }
  successResponse(res, team, 'Team rejected');
};

exports.requestCorrections = async (req, res) => {
  const { reason } = req.body;
  const team = await Team.findByIdAndUpdate(
    req.params.teamId,
    { status: 'needs_correction', rejectionReason: reason || 'Corrections requested by Association Head' },
    { new: true }
  );
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  await logAudit({
    action: 'team_corrections_requested',
    performedBy: req.user._id,
    targetModel: 'Team',
    targetId: team._id,
    details: { reason }
  });

  await Notification.create({
    userId: team.captainId,
    type: 'general',
    message: `Corrections requested for team "${team.name}": ${reason || 'Please review and resubmit'}`,
    refId: team._id,
    refModel: 'Team',
  });

  const io = req.app.get('io');
  if (io) {
    io.to(team.captainId.toString()).emit('notification:new', { type: 'team_corrections', teamId: team._id, reason });
  }
  successResponse(res, team, 'Corrections requested from team captain');
};

exports.suspendTeam = async (req, res) => {
  const { reason } = req.body;
  const team = await Team.findByIdAndUpdate(
    req.params.teamId,
    { status: 'suspended', rejectionReason: reason || 'Suspended by Association Head' },
    { new: true }
  );
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  // Remove captain from association group during suspension
  await Group.findOneAndUpdate(
    { type: 'association', refId: team.associationId },
    { $pull: { members: team.captainId } }
  );

  await logAudit({
    action: 'team_suspended',
    performedBy: req.user._id,
    targetModel: 'Team',
    targetId: team._id,
    details: { reason }
  });

  await Notification.create({
    userId: team.captainId,
    type: 'general',
    message: `Your team "${team.name}" has been suspended. Reason: ${reason || 'Suspended by Association Head'}`,
    refId: team._id,
    refModel: 'Team',
  });

  const io = req.app.get('io');
  if (io) {
    io.to(team.captainId.toString()).emit('notification:new', { type: 'team_suspended', teamId: team._id, reason });
  }
  successResponse(res, team, 'Team suspended');
};

exports.reactivateTeam = async (req, res) => {
  const team = await Team.findByIdAndUpdate(
    req.params.teamId,
    { status: 'approved', rejectionReason: null },
    { new: true }
  );
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  // Re-add captain to association group
  await Group.findOneAndUpdate(
    { type: 'association', refId: team.associationId },
    { $addToSet: { members: team.captainId } }
  );

  await logAudit({
    action: 'team_reactivated',
    performedBy: req.user._id,
    targetModel: 'Team',
    targetId: team._id,
    details: { teamName: team.name }
  });

  successResponse(res, team, 'Team reactivated');
};

exports.getAssociations = async (req, res) => {
  const { page = 1, limit = 100, search = '' } = req.query;
  const query = search ? { name: { $regex: search, $options: 'i' } } : {};
  const total = await Association.countDocuments(query);
  const associations = await Association.find(query)
    .populate('headUserId', 'name email')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ name: 1 });
  paginatedResponse(res, associations, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

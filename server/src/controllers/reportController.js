const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Booking = require('../models/Booking');
const Fund = require('../models/Fund');
const Ground = require('../models/Ground');
const Match = require('../models/Match');
const Fixture = require('../models/Fixture');
const { successResponse } = require('../utils/apiResponse');

exports.getReport = async (req, res) => {
  const { role, reportType } = req.params;
  let { associationId, tournamentId, teamId, startDate, endDate } = req.query;

  // Security & Tenancy check (Phase 1.3)
  if (req.user.role !== 'admin') {
    // 1. Role scoping: caller can only request report types belonging to their own role (or head for sub-roles)
    const allowedRoles = [req.user.role];
    if (req.user.role === 'association_head') {
      allowedRoles.push('association', 'funds_officer', 'ground_officer', 'tournament_organizer');
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: As a ${req.user.role}, you cannot access reports for role ${role}`
      });
    }

    // 2. Association scoping: must be user's association
    if (!req.user.associationId) {
      return res.status(403).json({ success: false, message: 'User does not belong to an association' });
    }

    if (associationId && associationId.toString() !== req.user.associationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access reports for another association'
      });
    }

    associationId = req.user.associationId.toString();
  }

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  let data = {};

  switch (`${role}:${reportType}`) {
    case 'admin:associations':
      data = await require('../models/Association').find(dateFilter).select('name status createdAt headUserId').populate('headUserId', 'name email');
      break;
    case 'admin:tournaments':
      data = await Tournament.find(dateFilter).select('name sport status startDate endDate registeredTeams').populate('associationId', 'name');
      break;
    case 'admin:matches':
      data = await Match.find(dateFilter).populate('teamA teamB', 'name').select('teamA teamB status scoreSummary startedAt endedAt');
      break;
    case 'admin:grounds':
      data = await Ground.find(dateFilter).select('name location type capacity status');
      break;
    case 'admin:revenue':
      data = await Fund.aggregate([
        { $match: { type: 'income', ...dateFilter } },
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      break;
    case 'admin:users':
      data = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } }
      ]);
      break;
    case 'association:teams':
      data = await Team.find({ associationId, ...dateFilter })
        .populate('captainId', 'name').select('name sport status matchesPlayed createdAt');
      break;
    case 'association:financial':
      data = await Fund.aggregate([
        { $match: { associationId: require('mongoose').Types.ObjectId.createFromHexString(associationId), ...dateFilter } },
        { $group: { _id: { type: '$type', category: '$category' }, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);
      break;
    case 'association:grounds':
    case 'association:ground_usage':
      data = await Booking.aggregate([
        { $match: { status: 'approved', ...dateFilter } },
        { $group: { _id: '$groundId', count: { $sum: 1 } } },
        { $lookup: { from: 'grounds', localField: '_id', foreignField: '_id', as: 'ground' } },
        { $unwind: '$ground' },
        { $project: { groundName: '$ground.name', count: 1 } }
      ]);
      break;
    case 'association:tournament':
      data = await Tournament.find({ associationId, ...dateFilter })
        .select('name sport status registeredTeams startDate endDate');
      break;
    case 'tournament_organizer:participation':
      data = await Tournament.findById(tournamentId)
        .populate('registeredTeams', 'name sport matchesPlayed');
      break;
    case 'tournament_organizer:statistics':
      data = await Fixture.find({ tournamentId })
        .populate('teamA teamB', 'name')
        .populate('matchId', 'scoreSummary status');
      break;
    case 'ground_officer:daily':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      data = await Booking.find({ date: { $gte: today, $lt: tomorrow }, status: 'approved' })
        .populate('groundId', 'name').populate('teamId', 'name sport');
      break;
    case 'ground_officer:monthly':
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      data = await Booking.find({ date: { $gte: monthStart, $lt: monthEnd } })
        .populate('groundId', 'name').populate('teamId', 'name sport');
      break;
    case 'funds_officer:income':
      data = await Fund.find({ type: 'income', associationId, ...dateFilter })
        .populate('requestedBy', 'name').populate('relatedTeamId', 'name');
      break;
    case 'funds_officer:expenses':
      data = await Fund.find({ type: 'expense', associationId, ...dateFilter })
        .populate('requestedBy', 'name').populate('approvedBy', 'name');
      break;
    case 'captain:match_history':
      data = await Match.find({ $or: [{ teamA: teamId }, { teamB: teamId }], status: 'completed' })
        .populate('teamA teamB', 'name').sort({ endedAt: -1 }).limit(20);
      break;
    default:
      return res.status(400).json({ success: false, message: `Unknown report type: ${role}:${reportType}` });
  }

  successResponse(res, data);
};

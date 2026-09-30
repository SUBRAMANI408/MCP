const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Booking = require('../models/Booking');
const Fund = require('../models/Fund');
const Match = require('../models/Match');
const Fixture = require('../models/Fixture');
const { successResponse } = require('../utils/apiResponse');

exports.getReport = async (req, res) => {
  const { role, reportType } = req.params;
  const { associationId, tournamentId, teamId, startDate, endDate } = req.query;
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

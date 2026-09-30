const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Booking = require('../models/Booking');
const Fund = require('../models/Fund');
const Match = require('../models/Match');
const Association = require('../models/Association');
const { successResponse } = require('../utils/apiResponse');

exports.getAnalytics = async (req, res) => {
  const last12Months = new Date();
  last12Months.setDate(1);
  last12Months.setMonth(last12Months.getMonth() - 11);
  last12Months.setHours(0, 0, 0, 0);

  const [
    monthlyUserGrowth,
    associationWiseUsers,
    tournamentStats,
    groundUsage,
    revenueTrends,
    sportParticipation,
    teamGrowth,
    liveMatchStats
  ] = await Promise.all([
    // 1. Monthly User Growth
    User.aggregate([
      { $match: { createdAt: { $gte: last12Months } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // 2. Association-wise Users
    User.aggregate([
      {
        $group: {
          _id: '$associationId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'associations',
          localField: '_id',
          foreignField: '_id',
          as: 'association'
        }
      },
      { $unwind: { path: '$association', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$association.name', 'No Association'] },
          count: 1
        }
      }
    ]),

    // 3. Tournament Stats
    Tournament.aggregate([
      { $match: { createdAt: { $gte: last12Months } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // 4. Ground Usage
    Booking.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$groundId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'grounds',
          localField: '_id',
          foreignField: '_id',
          as: 'ground'
        }
      },
      { $unwind: '$ground' },
      {
        $project: {
          name: '$ground.name',
          count: 1
        }
      }
    ]),

    // 5. Revenue Trends
    Fund.aggregate([
      { $match: { createdAt: { $gte: last12Months }, status: { $in: ['completed', 'approved'] } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // 6. Sport-wise Participation
    Team.aggregate([
      {
        $group: {
          _id: '$sport',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1
        }
      }
    ]),

    // 7. Team Growth
    Team.aggregate([
      { $match: { createdAt: { $gte: last12Months } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // 8. Live Match Stats
    Match.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
  ]);

  successResponse(res, {
    monthlyUserGrowth,
    associationWiseUsers,
    tournamentStats,
    groundUsage,
    revenueTrends,
    sportParticipation,
    teamGrowth,
    liveMatchStats
  });
};

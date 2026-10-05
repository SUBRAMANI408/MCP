const Booking = require('../models/Booking');
const Team = require('../models/Team');
const Ground = require('../models/Ground');
const Notification = require('../models/Notification');
const { checkBookingConflict } = require('../utils/conflictChecker');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.createBooking = async (req, res) => {
  const { groundId, teamId, date, startTime, endTime, purpose } = req.body;
  const team = await Team.findById(teamId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  const booking = await Booking.create({
    groundId, teamId, requestedBy: req.user._id,
    date, startTime, endTime, purpose: purpose || 'practice',
    priorityScore: team.matchesPlayed,
    status: 'pending',
  });
  const io = req.app.get('io');
  io.to(req.user.associationId?.toString()).emit('booking:new', { bookingId: booking._id });
  successResponse(res, booking, 'Booking request submitted', 201);
};

exports.getBookings = async (req, res) => {
  const { groundId, teamId, status, date, page = 1, limit = 10 } = req.query;
  const query = {};
  if (groundId) query.groundId = groundId;
  if (teamId) query.teamId = teamId;
  if (status) query.status = status;
  if (date) {
    const d = new Date(date);
    query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
  }
  // Role scoping
  if (req.user.role === 'captain' || req.user.role === 'vice_captain') {
    query.teamId = req.user.teamId;
  }
  const total = await Booking.countDocuments(query);
  const bookings = await Booking.find(query)
    .populate('groundId', 'name location')
    .populate('teamId', 'name sport')
    .populate('requestedBy', 'name')
    .populate('approvedBy', 'name')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, bookings, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('groundId', 'name location capacity')
    .populate('teamId', 'name sport captainId')
    .populate('requestedBy', 'name phone')
    .populate('approvedBy', 'name');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  successResponse(res, booking);
};

exports.approveBooking = async (req, res) => {
  const mongoose = require('mongoose');
  let booking = await Booking.findById(req.params.id).populate('teamId', 'name captainId');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const conflict = await checkBookingConflict(booking.groundId, booking.date, booking.startTime, booking.endTime, booking._id);

  let conflictTeam;
  let requestTeam;
  if (conflict) {
    conflictTeam = await Team.findById(conflict.teamId);
    requestTeam = await Team.findById(booking.teamId);
    if (requestTeam.matchesPlayed < conflictTeam.matchesPlayed) {
      booking.status = 'conflict';
      await booking.save();
      return res.status(409).json({
        success: false,
        message: 'Booking conflict exists. Current booking has lower priority.',
        conflict: { bookingId: conflict._id, team: conflictTeam.name }
      });
    }
  }

  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (conflict) {
          await Booking.findByIdAndUpdate(conflict._id, { status: 'rejected', rejectionReason: 'Overridden by higher priority team' }, { session });
          await Notification.create([{
            userId: conflictTeam.captainId,
            type: 'booking_rejected',
            message: `Your booking was overridden by a higher priority team.`,
            refId: conflict._id,
          }], { session });
        }
        
        booking.status = 'approved';
        booking.approvedBy = req.user._id;
        await booking.save({ session });
        
        await Notification.create([{
          userId: booking.teamId.captainId,
          type: 'booking_approved',
          message: `Your ground booking on ${new Date(booking.date).toDateString()} has been approved.`,
          refId: booking._id,
        }], { session });
      });
      session.endSession();
    } catch (txErr) {
      session.endSession();
      if (txErr.message && (txErr.message.includes('Transaction') || txErr.message.includes('replica set'))) {
        throw txErr;
      }
      return res.status(500).json({ success: false, message: 'Booking approval failed in transaction' });
    }
  } catch (err) {
    // Fallback without transaction
    try {
      if (conflict) {
        await Booking.findByIdAndUpdate(conflict._id, { status: 'rejected', rejectionReason: 'Overridden by higher priority team' });
        await Notification.create({
          userId: conflictTeam.captainId,
          type: 'booking_rejected',
          message: `Your booking was overridden by a higher priority team.`,
          refId: conflict._id,
        });
      }
      
      booking.status = 'approved';
      booking.approvedBy = req.user._id;
      await booking.save();
      
      await Notification.create({
        userId: booking.teamId.captainId,
        type: 'booking_approved',
        message: `Your ground booking on ${new Date(booking.date).toDateString()} has been approved.`,
        refId: booking._id,
      });
    } catch (fallbackErr) {
      return res.status(500).json({ success: false, message: 'Booking approval failed' });
    }
  }

  const io = req.app.get('io');
  io.to(booking.teamId.captainId.toString()).emit('notification:new', { type: 'booking_approved' });
  return successResponse(res, booking, 'Booking approved');
};

exports.rejectBooking = async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id).populate('teamId', 'captainId name');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  booking.status = 'rejected';
  booking.approvedBy = req.user._id;
  booking.rejectionReason = reason;
  await booking.save();
  await Notification.create({
    userId: booking.teamId.captainId,
    type: 'booking_rejected',
    message: `Your ground booking was rejected. Reason: ${reason || 'No reason given'}`,
    refId: booking._id,
  });
  successResponse(res, booking, 'Booking rejected');
};

exports.getCalendar = async (req, res) => {
  const { groundId, month, year } = req.query;
  const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  const bookings = await Booking.find({
    groundId, status: 'approved',
    date: { $gte: startDate, $lte: endDate }
  }).populate('teamId', 'name sport').populate('groundId', 'name');
  successResponse(res, bookings);
};

exports.getBookingReports = async (req, res) => {
  const { range = 'monthly', associationId } = req.query;
  const now = new Date();
  const start = range === 'daily'
    ? new Date(now.setHours(0, 0, 0, 0))
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const aggregation = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  successResponse(res, aggregation);
};

exports.getGroundOfficerDashboard = async (req, res) => {
  const assocId = req.user.associationId;
  if (!assocId) return res.status(400).json({ success: false, message: 'User is not linked to any association' });

  const grounds = await Ground.find({ associationId: assocId }, '_id name');
  const groundIds = grounds.map(g => g._id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalGrounds, availableGrounds, occupiedGrounds, groundsUnderMaintenance,
    totalBookingRequests, approvedBookings, rejectedBookings, pendingBookingRequests,
    todayBookings, upcomingBookings, friendlyMatchBookings, tournamentBookings,
    mostUsedRes
  ] = await Promise.all([
    Ground.countDocuments({ associationId: assocId }),
    Ground.countDocuments({ associationId: assocId, status: 'active', bookingEnabled: true }),
    Ground.countDocuments({ associationId: assocId, status: 'active', bookingEnabled: false }),
    Ground.countDocuments({ associationId: assocId, status: 'maintenance' }),
    Booking.countDocuments({ groundId: { $in: groundIds } }),
    Booking.countDocuments({ groundId: { $in: groundIds }, status: 'approved' }),
    Booking.countDocuments({ groundId: { $in: groundIds }, status: 'rejected' }),
    Booking.countDocuments({ groundId: { $in: groundIds }, status: 'pending' }),
    Booking.countDocuments({ groundId: { $in: groundIds }, date: { $gte: startOfDay, $lte: endOfDay }, status: 'approved' }),
    Booking.countDocuments({ groundId: { $in: groundIds }, date: { $gt: endOfDay }, status: 'approved' }),
    Booking.countDocuments({ groundId: { $in: groundIds }, purpose: 'friendly', status: 'approved' }),
    Booking.countDocuments({ groundId: { $in: groundIds }, purpose: 'tournament', status: 'approved' }),
    Booking.aggregate([
      { $match: { groundId: { $in: groundIds }, status: 'approved' } },
      { $group: { _id: '$groundId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  let mostUsedGround = 'N/A';
  let leastUsedGround = 'N/A';

  if (mostUsedRes.length > 0) {
    const mostObj = grounds.find(g => g._id.toString() === mostUsedRes[0]._id.toString());
    mostUsedGround = mostObj ? mostObj.name : 'N/A';

    const leastObj = grounds.find(g => g._id.toString() === mostUsedRes[mostUsedRes.length - 1]._id.toString());
    leastUsedGround = leastObj ? leastObj.name : 'N/A';
  }

  const utilizationRate = totalBookingRequests > 0 ? ((approvedBookings / totalBookingRequests) * 100).toFixed(1) : '0';

  successResponse(res, {
    totalGrounds,
    availableGrounds,
    occupiedGrounds,
    groundsUnderMaintenance,
    totalBookingRequests,
    approvedBookings,
    rejectedBookings,
    pendingBookingRequests,
    todayBookings,
    upcomingBookings,
    friendlyMatchBookings,
    tournamentBookings,
    utilizationRate,
    mostUsedGround,
    leastUsedGround
  });
};

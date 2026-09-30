const Booking = require('../models/Booking');

/**
 * Check if a ground booking has a time conflict
 * @param {ObjectId} groundId
 * @param {Date} date
 * @param {string} startTime - 'HH:MM'
 * @param {string} endTime - 'HH:MM'
 * @param {ObjectId} excludeBookingId - booking to exclude from check (for updates)
 * @returns {Object|null} conflicting booking or null
 */
const checkBookingConflict = async (groundId, date, startTime, endTime, excludeBookingId = null) => {
  const dateStr = new Date(date).toISOString().split('T')[0];

  const query = {
    groundId,
    status: 'approved',
    date: {
      $gte: new Date(dateStr),
      $lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000)
    }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(query).populate('teamId', 'name');

  // Convert HH:MM to minutes for comparison
  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const requestStart = toMinutes(startTime);
  const requestEnd = toMinutes(endTime);

  for (const booking of existingBookings) {
    const bookingStart = toMinutes(booking.startTime);
    const bookingEnd = toMinutes(booking.endTime);

    // Overlap check: not (requestEnd <= bookingStart || requestStart >= bookingEnd)
    if (!(requestEnd <= bookingStart || requestStart >= bookingEnd)) {
      return booking;
    }
  }

  return null;
};

module.exports = { checkBookingConflict };

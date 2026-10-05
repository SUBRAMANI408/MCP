const Booking = require('../models/Booking');
const Team = require('../models/Team');

/**
 * Calculates fair-allocation priority score for a booking request (Phase 5)
 * Formula:
 * 0.30 * matchesPlayedInWindow
 * - 0.25 * groundUsageCount30d
 * + 0.15 * freshnessScore (earlier requests rewarded)
 * + 0.20 * isTournamentMatch
 * + 0.10 * rotationIndex
 */
async function computePriorityScore(booking, team, ground) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Matches played in recent window
  const matchesPlayedInWindow = team ? (team.matchesPlayed || 0) : 0;

  // 2. Ground usage count in last 30 days
  const groundUsageCount30d = await Booking.countDocuments({
    teamId: booking.teamId,
    groundId: booking.groundId,
    status: 'approved',
    date: { $gte: thirtyDaysAgo, $lte: now },
  });

  // 3. Request freshness (normalized between 0 and 10 based on advance booking)
  const daysInAdvance = Math.max(0, Math.min(30, (new Date(booking.date) - now) / (24 * 60 * 60 * 1000)));
  const freshnessScore = daysInAdvance / 3;

  // 4. Tournament priority
  const isTournamentMatch = booking.purpose === 'tournament' ? 10 : 0;

  // 5. Rotation index (teams with fewer recent bookings get higher score)
  const totalRecentBookings = await Booking.countDocuments({
    teamId: booking.teamId,
    status: 'approved',
    date: { $gte: thirtyDaysAgo },
  });
  const rotationIndex = Math.max(0, 10 - totalRecentBookings);

  // Computed total score
  const computedScore = Number((
    (0.30 * matchesPlayedInWindow) -
    (0.25 * groundUsageCount30d * 2) +
    (0.15 * freshnessScore) +
    (0.20 * isTournamentMatch) +
    (0.10 * rotationIndex)
  ).toFixed(2));

  return {
    priorityScore: computedScore,
    scoreBreakdown: {
      matchesPlayedInWindow,
      groundUsageCount30d,
      freshnessScore: Number(freshnessScore.toFixed(2)),
      isTournamentMatch,
      rotationIndex,
      computedScore,
    },
  };
}

module.exports = { computePriorityScore };

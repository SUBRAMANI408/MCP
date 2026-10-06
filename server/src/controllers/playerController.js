const PlayerStat = require('../models/PlayerStat');
const User = require('../models/User');
const { successResponse } = require('../utils/apiResponse');

exports.getPlayerStats = async (req, res) => {
  const { id } = req.params;
  const { sport = 'cricket', season = 'all-time' } = req.query;

  const user = await User.findById(id).select('name email avatar role teamId associationId').populate('teamId', 'name sport');
  if (!user) {
    return res.status(404).json({ success: false, message: 'Player not found' });
  }

  let stats = await PlayerStat.findOne({ playerId: id, sport, season }).populate('teamId', 'name sport');
  if (!stats) {
    stats = {
      playerId: id,
      sport,
      season,
      matches: 0,
      playerOfTheMatchCount: 0,
      cricket: {
        innings: 0, runs: 0, ballsFaced: 0, highestScore: 0, notOuts: 0,
        fours: 0, sixes: 0, strikeRate: 0, battingAverage: 0,
        oversBowled: 0, maidens: 0, runsConceded: 0, wickets: 0,
        bestBowling: { wickets: 0, runs: 0 }, economy: 0,
        catches: 0, stumpings: 0, runOuts: 0,
      },
      football: {
        goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, minutes: 0,
      },
      basketball: { points: 0, rebounds: 0, assists: 0, fouls: 0, steals: 0, blocks: 0 },
      volleyball: { aces: 0, kills: 0, blocks: 0, digs: 0 },
      kabaddi: { raidPoints: 0, tacklePoints: 0, bonusPoints: 0, superRaids: 0, superTackles: 0 },
    };
  }

  const allStats = await PlayerStat.find({ playerId: id });

  successResponse(res, { player: user, stats, allStats }, 'Player stats retrieved');
};

exports.getLeaderboards = async (req, res) => {
  const { sport = 'cricket', season = 'all-time', limit = 10 } = req.query;

  const topRunScorers = await PlayerStat.find({ sport: 'cricket', season })
    .sort({ 'cricket.runs': -1 })
    .limit(Number(limit))
    .populate('playerId', 'name avatar')
    .populate('teamId', 'name logo');

  const topWicketTakers = await PlayerStat.find({ sport: 'cricket', season })
    .sort({ 'cricket.wickets': -1 })
    .limit(Number(limit))
    .populate('playerId', 'name avatar')
    .populate('teamId', 'name logo');

  const topFootballScorers = await PlayerStat.find({ sport: 'football', season })
    .sort({ 'football.goals': -1 })
    .limit(Number(limit))
    .populate('playerId', 'name avatar')
    .populate('teamId', 'name logo');

  const mostPOTM = await PlayerStat.find({ sport, season })
    .sort({ playerOfTheMatchCount: -1 })
    .limit(Number(limit))
    .populate('playerId', 'name avatar')
    .populate('teamId', 'name logo');

  successResponse(res, {
    sport,
    season,
    topRunScorers,
    topWicketTakers,
    topFootballScorers,
    mostPOTM,
  }, 'Leaderboards retrieved');
};

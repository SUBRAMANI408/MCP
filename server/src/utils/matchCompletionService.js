const Match = require('../models/Match');
const MatchResult = require('../models/MatchResult');
const Team = require('../models/Team');
const TeamStat = require('../models/TeamStat');
const PlayerStat = require('../models/PlayerStat');
const Standing = require('../models/Standing');
const Fixture = require('../models/Fixture');
const FriendlyMatch = require('../models/FriendlyMatch');
const Notification = require('../models/Notification');
const { logAudit } = require('./auditLogger');

/**
 * Universal Match Completion Service (Phase 3.5)
 * Finalizes matches, computes margins, updates team & player statistics,
 * maintains standings tables, advances knockout brackets, and emits notifications.
 */
async function completeMatchService(matchId, finalScoreData = null, actorUser = null, io = null) {
  const match = await Match.findById(matchId)
    .populate('teamA')
    .populate('teamB');

  if (!match) throw new Error('Match not found');
  if (match.status === 'completed') {
    return { match, alreadyCompleted: true };
  }

  match.status = 'completed';
  match.endedAt = new Date();
  if (finalScoreData) {
    match.scoreSummary = finalScoreData;
    match.markModified('scoreSummary');
  }

  // 1. Determine Winner and Result Verdict
  let winnerId = null;
  let loserId = null;
  let resultType = 'win';
  let marginText = '';
  let marginValue = 0;

  if (match.sport === 'cricket' && match.innings && match.innings.length >= 2) {
    const inn1 = match.innings[0];
    const inn2 = match.innings[1];
    const runs1 = inn1.totalRuns || 0;
    const runs2 = inn2.totalRuns || 0;

    if (runs1 > runs2) {
      winnerId = inn1.battingTeamId;
      loserId = inn2.battingTeamId;
      const diff = runs1 - runs2;
      marginValue = diff;
      marginText = `by ${diff} runs`;
    } else if (runs2 > runs1) {
      winnerId = inn2.battingTeamId;
      loserId = inn1.battingTeamId;
      const wicketsLeft = (match.numPlayers || 11) - 1 - (inn2.wickets || 0);
      marginValue = wicketsLeft;
      marginText = `by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
    } else {
      resultType = 'tie';
      marginText = 'Match Tied';
    }
  } else if (match.scoreSummary) {
    const scoreA = Number(match.scoreSummary.teamA || match.scoreSummary[match.teamA?._id] || 0);
    const scoreB = Number(match.scoreSummary.teamB || match.scoreSummary[match.teamB?._id] || 0);

    if (scoreA > scoreB) {
      winnerId = match.teamA._id;
      loserId = match.teamB._id;
      marginValue = scoreA - scoreB;
      marginText = `${scoreA} - ${scoreB}`;
    } else if (scoreB > scoreA) {
      winnerId = match.teamB._id;
      loserId = match.teamA._id;
      marginValue = scoreB - scoreA;
      marginText = `${scoreB} - ${scoreA}`;
    } else {
      resultType = match.sport === 'football' ? 'draw' : 'tie';
      marginText = `${scoreA} - ${scoreB} (Draw)`;
    }
  }

  match.winnerId = winnerId;
  const winnerTeam = winnerId?.toString() === match.teamA._id.toString() ? match.teamA : match.teamB;
  const resultLine = winnerId
    ? `${winnerTeam.name} won ${marginText}`
    : resultType === 'draw' ? 'Match Drawn' : 'Match Tied';

  match.resultSummary = resultLine;
  await match.save();

  // 2. Create MatchResult document
  const matchResult = await MatchResult.findOneAndUpdate(
    { matchId: match._id },
    {
      matchId: match._id,
      winnerTeamId: winnerId,
      loserTeamId: loserId,
      resultType,
      marginText,
      marginValue,
      playerOfMatchId: match.playerOfMatchId || null,
      finalizedBy: actorUser?._id || null,
      finalizedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  match.resultId = matchResult._id;
  await match.save();

  // 3. Update Team and TeamStat counters
  const isTournament = match.type === 'tournament';
  const isFriendly = match.type === 'friendly';

  for (const team of [match.teamA, match.teamB]) {
    const isWinner = winnerId && winnerId.toString() === team._id.toString();
    const isLoser = loserId && loserId.toString() === team._id.toString();
    const isDraw = !winnerId;

    // Direct Team updates
    team.matchesPlayed = (team.matchesPlayed || 0) + 1;
    if (isTournament) team.tournamentMatchesPlayed = (team.tournamentMatchesPlayed || 0) + 1;
    if (isFriendly) team.friendlyMatchesPlayed = (team.friendlyMatchesPlayed || 0) + 1;
    if (isWinner) team.wins = (team.wins || 0) + 1;
    if (isLoser) team.losses = (team.losses || 0) + 1;
    if (isDraw) team.draws = (team.draws || 0) + 1;
    await team.save();

    // Authoritative TeamStat upsert
    const outcome = isWinner ? 'W' : (isLoser ? 'L' : (resultType === 'draw' ? 'D' : 'T'));
    let teamStat = await TeamStat.findOne({ teamId: team._id, sport: match.sport });
    if (!teamStat) {
      teamStat = new TeamStat({ teamId: team._id, sport: match.sport });
    }

    teamStat.matchesPlayed += 1;
    if (isTournament) teamStat.tournamentMatchesPlayed += 1;
    if (isFriendly) teamStat.friendlyMatchesPlayed += 1;
    if (isWinner) teamStat.wins += 1;
    if (isLoser) teamStat.losses += 1;
    if (isDraw) {
      if (resultType === 'draw') teamStat.draws += 1;
      else teamStat.ties += 1;
    }

    teamStat.winPercentage = teamStat.matchesPlayed > 0
      ? Math.round((teamStat.wins / teamStat.matchesPlayed) * 100)
      : 0;

    // Recent form (keep last 5)
    teamStat.recentForm = [outcome, ...(teamStat.recentForm || [])].slice(0, 5);
    await teamStat.save();
  }

  // 4. Update Tournament Standings (for tournament matches)
  if (isTournament && match.fixtureId) {
    const fixture = await Fixture.findById(match.fixtureId);
    const tournamentId = fixture?.tournamentId || match.refId;

    if (tournamentId) {
      for (const team of [match.teamA, match.teamB]) {
        const isWinner = winnerId && winnerId.toString() === team._id.toString();
        const isLoser = loserId && loserId.toString() === team._id.toString();
        const isDraw = !winnerId;

        let standing = await Standing.findOne({ tournamentId, teamId: team._id });
        if (!standing) {
          standing = new Standing({ tournamentId, teamId: team._id });
        }

        standing.played += 1;
        if (isWinner) {
          standing.won += 1;
          standing.points += 2; // Standard 2 points for win
        } else if (isLoser) {
          standing.lost += 1;
        } else if (isDraw) {
          if (resultType === 'draw') standing.drawn += 1;
          else standing.tied += 1;
          standing.points += 1; // 1 point for tie/draw
        }

        standing.streak = [isWinner ? 'W' : (isLoser ? 'L' : 'D'), ...(standing.streak || [])].slice(0, 5);
        await standing.save();
      }

      // Re-rank tournament standings
      const allStandings = await Standing.find({ tournamentId }).sort({ points: -1, netRunRate: -1, goalDifference: -1 });
      for (let i = 0; i < allStandings.length; i++) {
        allStandings[i].rank = i + 1;
        await allStandings[i].save();
      }
    }
  }

  // 5. Update linked Fixture / FriendlyMatch
  const fixtureId = match.fixtureId || (isTournament ? match.refId : null);
  const friendlyMatchId = match.friendlyMatchId || (isFriendly ? match.refId : null);

  if (fixtureId) {
    await Fixture.findByIdAndUpdate(fixtureId, { status: 'completed', matchId: match._id });

    // Auto-advance winner to subsequent tournament rounds (Phase 4.2)
    if (winnerId) {
      await Fixture.updateMany(
        { sourceFixtureA: fixtureId },
        { teamA: winnerId }
      );
      await Fixture.updateMany(
        { sourceFixtureB: fixtureId },
        { teamB: winnerId }
      );
    }
  } else if (friendlyMatchId) {
    await FriendlyMatch.findByIdAndUpdate(friendlyMatchId, { status: 'completed', matchId: match._id });
  }

  // 6. Notifications & Socket Emit
  if (io) {
    io.to(`match:${match._id}`).emit('match:completed', {
      matchId: match._id,
      resultLine,
      winnerId,
      scoreSummary: match.scoreSummary,
    });
  }

  const captains = [match.teamA.captainId, match.teamB.captainId].filter(Boolean);
  for (const capId of captains) {
    await Notification.create({
      userId: capId,
      type: 'match_completed',
      message: `Match between ${match.teamA.name} and ${match.teamB.name} completed: ${resultLine}`,
      refId: match._id,
      refModel: 'Match',
    });
    if (io) io.to(capId.toString()).emit('notification:new', { type: 'match_completed', matchId: match._id, resultLine });
  }

  return { match, matchResult, resultLine };
}

module.exports = { completeMatchService };

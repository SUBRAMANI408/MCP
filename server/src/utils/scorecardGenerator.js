/**
 * Scorecard Generator (Phase 3.3)
 * Aggregates complete cricket & multi-sport scorecards from stored ball/event logs.
 */

function generateCricketScorecard(match) {
  if (!match || !match.innings) return {};

  const inningsData = match.innings.map((inning, idx) => {
    const batsmenMap = {};
    const bowlersMap = {};
    const fallOfWickets = [];
    let totalBalls = 0;
    let totalRuns = 0;
    let wickets = 0;

    const extras = {
      wide: 0,
      noBall: 0,
      bye: 0,
      legBye: 0,
      penalty: 0,
      total: 0,
    };

    const balls = inning.balls || [];

    balls.forEach((ball) => {
      const isLegal = !ball.extraType || ball.extraType === 'bye' || ball.extraType === 'leg_bye';
      const batterId = ball.batsmanId ? ball.batsmanId.toString() : 'unknown';
      const bowlerId = ball.bowlerId ? ball.bowlerId.toString() : 'unknown';

      // Batter stats
      if (!batsmenMap[batterId]) {
        batsmenMap[batterId] = {
          playerId: ball.batsmanId,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          dismissal: 'not out',
        };
      }

      if (isLegal || ball.extraType === 'no_ball') {
        batsmenMap[batterId].balls += isLegal ? 1 : 0;
      }
      batsmenMap[batterId].runs += (ball.runs || 0);
      if (ball.isBoundary) batsmenMap[batterId].fours += 1;
      if (ball.isSix) batsmenMap[batterId].sixes += 1;

      // Extras
      if (ball.extraType) {
        const extraRuns = ball.extraRuns || 1;
        if (ball.extraType === 'wide') extras.wide += extraRuns;
        else if (ball.extraType === 'no_ball') extras.noBall += extraRuns;
        else if (ball.extraType === 'bye') extras.bye += extraRuns;
        else if (ball.extraType === 'leg_bye') extras.legBye += extraRuns;
        else if (ball.extraType === 'penalty') extras.penalty += extraRuns;
        extras.total += extraRuns;
        totalRuns += extraRuns;
      }

      totalRuns += (ball.runs || 0);

      // Bowler stats
      if (!bowlersMap[bowlerId]) {
        bowlersMap[bowlerId] = {
          playerId: ball.bowlerId,
          balls: 0,
          runs: 0,
          wickets: 0,
          maidens: 0,
          wides: 0,
          noBalls: 0,
        };
      }

      if (isLegal) {
        bowlersMap[bowlerId].balls += 1;
        totalBalls += 1;
      }
      if (ball.extraType !== 'bye' && ball.extraType !== 'leg_bye') {
        bowlersMap[bowlerId].runs += (ball.runs || 0) + (ball.extraRuns || (ball.extraType ? 1 : 0));
      }
      if (ball.extraType === 'wide') bowlersMap[bowlerId].wides += 1;
      if (ball.extraType === 'no_ball') bowlersMap[bowlerId].noBalls += 1;

      // Wickets
      if (ball.isWicket) {
        wickets += 1;
        if (batsmenMap[batterId]) {
          batsmenMap[batterId].dismissal = ball.wicketType || 'out';
        }
        if (ball.wicketType !== 'run_out') {
          bowlersMap[bowlerId].wickets += 1;
        }
        const overFormatted = `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
        fallOfWickets.push({
          score: totalRuns,
          wicket: wickets,
          over: overFormatted,
          batsmanId: ball.batsmanId,
        });
      }
    });

    // Format batsman table
    const battingTable = Object.values(batsmenMap).map(b => ({
      ...b,
      strikeRate: b.balls > 0 ? Number(((b.runs / b.balls) * 100).toFixed(1)) : 0,
    }));

    // Format bowler table
    const bowlingTable = Object.values(bowlersMap).map(b => {
      const completedOvers = Math.floor(b.balls / 6);
      const remainingBalls = b.balls % 6;
      const oversText = `${completedOvers}.${remainingBalls}`;
      const totalOversDec = b.balls / 6;
      const economy = totalOversDec > 0 ? Number((b.runs / totalOversDec).toFixed(2)) : 0;
      return {
        ...b,
        overs: oversText,
        economy,
      };
    });

    const completedOvers = Math.floor(totalBalls / 6);
    const remBalls = totalBalls % 6;
    const currentRunRate = totalBalls > 0 ? Number(((totalRuns / totalBalls) * 6).toFixed(2)) : 0;

    return {
      inningIndex: idx,
      battingTeamId: inning.battingTeamId,
      bowlingTeamId: inning.bowlingTeamId,
      totalRuns,
      wickets,
      overs: `${completedOvers}.${remBalls}`,
      currentRunRate,
      extras,
      battingTable,
      bowlingTable,
      fallOfWickets,
      targetRuns: inning.targetRuns || null,
    };
  });

  // Calculate required run rate if in 2nd inning
  let requiredRunRate = null;
  let ballsRemaining = null;

  if (inningsData.length >= 2 && match.totalOvers) {
    const target = inningsData[1].targetRuns || (inningsData[0].totalRuns + 1);
    const currentScore = inningsData[1].totalRuns;
    const totalMatchBalls = match.totalOvers * 6;
    const [innOvers, innBalls] = inningsData[1].overs.split('.').map(Number);
    const ballsBowled = (innOvers * 6) + (innBalls || 0);
    ballsRemaining = Math.max(0, totalMatchBalls - ballsBowled);
    const runsNeeded = Math.max(0, target - currentScore);

    requiredRunRate = ballsRemaining > 0 ? Number(((runsNeeded / ballsRemaining) * 6).toFixed(2)) : 0;
  }

  return {
    matchId: match._id,
    sport: match.sport,
    status: match.status,
    totalOvers: match.totalOvers,
    innings: inningsData,
    requiredRunRate,
    ballsRemaining,
    resultSummary: match.resultSummary,
  };
}

module.exports = { generateCricketScorecard };

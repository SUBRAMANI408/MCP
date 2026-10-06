const Match = require('../models/Match');
const Team = require('../models/Team');
const { successResponse } = require('../utils/apiResponse');

/* ─── Setup match (pre-match) ──────────────────────────────────────────────── */
exports.setupMatch = async (req, res) => {
  const {
    sport, teamAId, teamBId, groundId, type, refId, fixtureId, friendlyMatchId, scheduledAt,
    totalOvers, ballType, numPlayers, tossWinner, tossDecision, associationId
  } = req.body;

  const match = await Match.create({
    sport: sport || 'cricket',
    type: type || 'friendly',
    refId: refId || null,
    fixtureId: fixtureId || null,
    friendlyMatchId: friendlyMatchId || null,
    teamA: teamAId,
    teamB: teamBId,
    groundId: groundId || null,
    associationId: associationId || null,
    scheduledAt: scheduledAt || new Date(),
    totalOvers: totalOvers || 20,
    ballType: ballType || 'leather',
    numPlayers: numPlayers || 11,
    tossWinner: tossWinner || null,
    tossDecision: tossDecision || null,
    status: 'scheduled',
    scorerId: req.user._id,
    // Initialize innings
    innings: sport === 'cricket' ? [
      { battingTeamId: tossDecision === 'bat' ? tossWinner : (tossWinner === teamAId ? teamBId : teamAId), bowlingTeamId: tossDecision === 'bat' ? (tossWinner === teamAId ? teamBId : teamAId) : tossWinner, balls: [], extras: { wide: 0, noBall: 0, bye: 0, legBye: 0, penalty: 0, total: 0 }, partnerships: [], fallOfWickets: [], completed: false },
    ] : [],
    scoreSummary: {},
  });

  const populated = await Match.findById(match._id)
    .populate('teamA', 'name sport logo')
    .populate('teamB', 'name sport logo')
    .populate('groundId', 'name location');

  successResponse(res, populated, 'Match setup complete', 201);
};

/* ─── Cricket: Ball-by-ball scoring ───────────────────────────────────────── */
exports.cricketBall = async (req, res) => {
  const { inningIndex = 0, runs, extraType, extraRuns = 0, isWicket, wicketType, batsmanId, bowlerId, fielderIds, isBoundary, isSix, commentary } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match || match.sport !== 'cricket') return res.status(400).json({ success: false, message: 'Not a cricket match' });
  if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Match is not live' });

  const inning = match.innings[inningIndex];
  if (!inning) return res.status(400).json({ success: false, message: 'Inning not found' });

  const currentBalls = inning.balls.length;
  const currentOver = Math.floor(currentBalls / 6);
  const ballInOver = currentBalls % 6;
  const isLegalBall = !extraType || (extraType === 'bye' || extraType === 'leg_bye');

  const ball = {
    ballNum: currentBalls + 1,
    over: currentOver,
    runs: runs || 0,
    extraType: extraType || null,
    extraRuns: extraRuns || 0,
    isWicket: isWicket || false,
    wicketType: wicketType || null,
    batsmanId: batsmanId || null,
    bowlerId: bowlerId || null,
    fielderIds: fielderIds || [],
    isBoundary: isBoundary || false,
    isSix: isSix || false,
    commentary,
  };

  inning.balls.push(ball);

  // Update totals
  const ballRuns = (runs || 0) + (extraRuns || 0);
  inning.totalRuns = (inning.totalRuns || 0) + ballRuns;

  if (isWicket) {
    inning.wickets = (inning.wickets || 0) + 1;
    inning.fallOfWickets.push({
      wicket: inning.wickets,
      runs: inning.totalRuns,
      batsmanId,
      over: currentOver + (ballInOver + 1) / 10,
    });
  }

  if (extraType) {
    const key = extraType === 'no_ball' ? 'noBall' : extraType.replace('_', '');
    if (inning.extras[key] !== undefined) {
      inning.extras[key] = (inning.extras[key] || 0) + (extraRuns || 1);
    }
    inning.extras.total = (inning.extras.total || 0) + (extraRuns || 1);
  }

  // Consecutive overs rule check
  const activeBowler = bowlerId || match.currentBowlerId;
  if (match.previousBowlerId && activeBowler && match.previousBowlerId.toString() === activeBowler.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Rule violation: Same bowler cannot bowl consecutive overs'
    });
  }
  if (bowlerId) match.currentBowlerId = bowlerId;

  if (isLegalBall) {
    const legalBalls = inning.balls.filter(b => !b.extraType || b.extraType === 'bye' || b.extraType === 'leg_bye').length;
    inning.overs = parseFloat((Math.floor(legalBalls / 6) + (legalBalls % 6) / 10).toFixed(1));
    if (legalBalls > 0 && legalBalls % 6 === 0) {
      match.previousBowlerId = activeBowler || null;
      match.currentBowlerId = null;
    }
  }

  // Update score summary
  const battingKey = inning.battingTeamId?.toString() === match.teamA?.toString() ? 'teamA' : 'teamB';
  match.scoreSummary = {
    ...match.scoreSummary,
    [battingKey]: { runs: inning.totalRuns, wickets: inning.wickets || 0, overs: inning.overs || 0 },
  };
  match.markModified('scoreSummary');
  match.markModified('innings');

  await match.save();

  const io = req.app.get('io');
  io.to(`match:${match._id}`).emit('match:update', {
    matchId: match._id, ball, inning: inningIndex,
    scoreSummary: match.scoreSummary, innings: match.innings,
  });

  successResponse(res, { ball, scoreSummary: match.scoreSummary, innings: match.innings });
};

/* ─── Cricket: Switch innings ──────────────────────────────────────────────── */
exports.switchInnings = async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match || match.sport !== 'cricket') return res.status(400).json({ success: false, message: 'Not a cricket match' });

  const currentInning = match.innings[match.currentInning];
  if (currentInning) currentInning.completed = true;

  const firstInningRuns = match.innings[0]?.totalRuns || 0;

  // Create second inning
  if (match.innings.length < 2) {
    const batTeam = match.innings[0]?.bowlingTeamId;
    const bowlTeam = match.innings[0]?.battingTeamId;
    match.innings.push({
      battingTeamId: batTeam,
      bowlingTeamId: bowlTeam,
      balls: [],
      extras: { wide: 0, noBall: 0, bye: 0, legBye: 0, penalty: 0, total: 0 },
      partnerships: [],
      fallOfWickets: [],
      completed: false,
      targetRuns: firstInningRuns + 1,
    });
  }

  match.currentInning = (match.currentInning || 0) + 1;
  match.previousBowlerId = null;
  match.currentBowlerId = null;
  match.markModified('innings');
  await match.save();

  const io = req.app.get('io');
  io.to(`match:${match._id}`).emit('match:innings_switch', { innings: match.innings, currentInning: match.currentInning });
  successResponse(res, match, 'Innings switched');
};

/* ─── Football events ──────────────────────────────────────────────────────── */
exports.footballEvent = async (req, res) => {
  const { type, teamId, playerId, assistPlayerId, minute, description } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match || match.sport !== 'football') return res.status(400).json({ success: false, message: 'Not a football match' });
  if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Match is not live' });

  const event = { timestamp: new Date(), type, teamId, playerId, data: { minute, description, assistPlayerId } };
  match.events.push(event);

  // Update score for goals
  if (type === 'goal') {
    const teamKey = teamId?.toString() === match.teamA?.toString() ? 'teamA' : 'teamB';
    match.scoreSummary = {
      ...match.scoreSummary,
      [teamKey]: (match.scoreSummary?.[teamKey] || 0) + 1,
    };
    match.markModified('scoreSummary');
  }
  await match.save();

  const io = req.app.get('io');
  io.to(`match:${match._id}`).emit('match:update', {
    matchId: match._id, event, scoreSummary: match.scoreSummary,
  });
  successResponse(res, { event, scoreSummary: match.scoreSummary });
};

/* ─── Volleyball set score ─────────────────────────────────────────────────── */
exports.volleyballSet = async (req, res) => {
  const { setNum, scoreA, scoreB } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match || match.sport !== 'volleyball') return res.status(400).json({ success: false, message: 'Not a volleyball match' });

  const sets = match.scoreSummary?.sets || [];
  sets[setNum - 1] = { scoreA, scoreB };

  const teamAWins = sets.filter(s => s?.scoreA > s?.scoreB).length;
  const teamBWins = sets.filter(s => s?.scoreB > s?.scoreA).length;

  match.scoreSummary = { ...match.scoreSummary, sets, teamA: teamAWins, teamB: teamBWins };
  match.markModified('scoreSummary');
  await match.save();

  const io = req.app.get('io');
  io.to(`match:${match._id}`).emit('match:update', { matchId: match._id, scoreSummary: match.scoreSummary });
  successResponse(res, match.scoreSummary);
};

/* ─── Basketball / Kabaddi generic event ──────────────────────────────────── */
exports.genericEvent = async (req, res) => {
  const { type, teamId, playerId, points, data } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Match is not live' });

  const event = { timestamp: new Date(), type, teamId, playerId, data: { points, ...data } };
  match.events.push(event);

  if (points) {
    const teamKey = teamId?.toString() === match.teamA?.toString() ? 'teamA' : 'teamB';
    match.scoreSummary = {
      ...match.scoreSummary,
      [teamKey]: (match.scoreSummary?.[teamKey] || 0) + (points || 0),
    };
    match.markModified('scoreSummary');
  }
  await match.save();

  const io = req.app.get('io');
  io.to(`match:${match._id}`).emit('match:update', {
    matchId: match._id, event, scoreSummary: match.scoreSummary,
  });
  successResponse(res, { event, scoreSummary: match.scoreSummary });
};

/* ─── Set Player of Match ──────────────────────────────────────────────────── */
exports.setPlayerOfMatch = async (req, res) => {
  const { playerId } = req.body;
  const match = await Match.findByIdAndUpdate(
    req.params.id,
    { playerOfMatchId: playerId },
    { new: true }
  ).populate('playerOfMatchId', 'name avatar');
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  const io = req.app.get('io');
  io.to(`match:${match._id}`).emit('match:player_of_match', { player: match.playerOfMatchId });
  successResponse(res, match, 'Player of match set');
};

/* ─── Takeover Scoring ─────────────────────────────────────────────────────── */
exports.takeoverScoring = async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Match is not live' });

  match.scorerId = req.user._id;
  match.scorerLockedAt = new Date();
  await match.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`match:${match._id}`).emit('match:takeover', {
      matchId: match._id,
      scorerId: match.scorerId,
      scorerLockedAt: match.scorerLockedAt
    });
  }

  successResponse(res, { scorerId: match.scorerId, scorerLockedAt: match.scorerLockedAt }, 'Successfully taken over scoring');
};

const { generateCricketScorecard } = require('../utils/scorecardGenerator');

/* ─── Cricket: Batsman & Bowler Selection (Phase 3.1) ─────────────────────── */
exports.selectBatsman = async (req, res) => {
  const { strikerId, nonStrikerId } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match || match.sport !== 'cricket') return res.status(400).json({ success: false, message: 'Invalid cricket match' });

  if (!match.currentBatsmen) {
    match.currentBatsmen = {};
  }
  if (strikerId !== undefined) match.currentBatsmen.strikerId = strikerId || null;
  if (nonStrikerId !== undefined) match.currentBatsmen.nonStrikerId = nonStrikerId || null;
  match.markModified('currentBatsmen');
  await match.save();

  const io = req.app.get('io');
  if (io) io.to(`match:${match._id}`).emit('match:batsmen_updated', { currentBatsmen: match.currentBatsmen });
  successResponse(res, match.currentBatsmen, 'Batsmen updated');
};

exports.selectBowler = async (req, res) => {
  const { bowlerId } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match || match.sport !== 'cricket') return res.status(400).json({ success: false, message: 'Invalid cricket match' });

  if (match.previousBowlerId && bowlerId && match.previousBowlerId.toString() === bowlerId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Rule violation: Same bowler cannot bowl consecutive overs'
    });
  }

  match.currentBowlerId = bowlerId;
  await match.save();

  const io = req.app.get('io');
  if (io) io.to(`match:${match._id}`).emit('match:bowler_updated', { currentBowlerId: match.currentBowlerId });
  successResponse(res, { currentBowlerId: match.currentBowlerId }, 'Bowler selected');
};

exports.swapStrike = async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match || match.sport !== 'cricket') return res.status(400).json({ success: false, message: 'Invalid cricket match' });

  if (!match.currentBatsmen) {
    match.currentBatsmen = {};
  }
  const temp = match.currentBatsmen.strikerId;
  match.currentBatsmen.strikerId = match.currentBatsmen.nonStrikerId;
  match.currentBatsmen.nonStrikerId = temp;
  match.markModified('currentBatsmen');
  await match.save();

  const io = req.app.get('io');
  if (io) io.to(`match:${match._id}`).emit('match:strike_swapped', { currentBatsmen: match.currentBatsmen });
  successResponse(res, match.currentBatsmen, 'Strike swapped');
};

/* ─── Cricket: Undo Last Ball (Phase 3.2) ─────────────────────────────────── */
exports.undoLastBall = async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match || match.sport !== 'cricket') return res.status(400).json({ success: false, message: 'Invalid cricket match' });
  if (match.status !== 'live') return res.status(400).json({ success: false, message: 'Match is not live' });

  const inningIndex = match.currentInning || 0;
  const inning = match.innings[inningIndex];
  if (!inning || !inning.balls || inning.balls.length === 0) {
    return res.status(400).json({ success: false, message: 'No balls to undo in this inning' });
  }

  const removedBall = inning.balls.pop();

  // Recalculate totals
  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  const extras = { wide: 0, noBall: 0, bye: 0, legBye: 0, penalty: 0, total: 0 };

  inning.balls.forEach(b => {
    const isLegal = !b.extraType || b.extraType === 'bye' || b.extraType === 'leg_bye';
    if (isLegal) legalBalls += 1;
    if (b.isWicket) wickets += 1;
    totalRuns += (b.runs || 0) + (b.extraRuns || (b.extraType ? 1 : 0));
    if (b.extraType) {
      extras[b.extraType] = (extras[b.extraType] || 0) + (b.extraRuns || 1);
      extras.total += (b.extraRuns || 1);
    }
  });

  inning.totalRuns = totalRuns;
  inning.wickets = wickets;
  inning.overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  inning.extras = extras;

  const teamKey = inning.battingTeamId?.toString() === match.teamA?.toString() ? 'teamA' : 'teamB';
  match.scoreSummary = {
    ...match.scoreSummary,
    [teamKey]: totalRuns,
  };

  const isRemovedLegal = !removedBall.extraType || removedBall.extraType === 'bye' || removedBall.extraType === 'leg_bye';
  if (isRemovedLegal && (legalBalls + 1) % 6 === 0) {
    match.currentBowlerId = match.previousBowlerId;
    match.previousBowlerId = null;
  }

  match.markModified('innings');
  match.markModified('scoreSummary');
  await match.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`match:${match._id}`).emit('match:update', {
      matchId: match._id,
      innings: match.innings,
      scoreSummary: match.scoreSummary,
      undoneBall: removedBall,
    });
  }

  successResponse(res, { inning, scoreSummary: match.scoreSummary }, 'Last ball removed and recalculated');
};

/* ─── Match: Abandon (Phase 3.2) ─────────────────────────────────────────── */
exports.abandonMatch = async (req, res) => {
  const { reason = 'Weather / Abandoned' } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

  match.status = 'cancelled';
  match.resultSummary = `Match Abandoned: ${reason}`;
  match.endedAt = new Date();
  await match.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`match:${match._id}`).emit('match:update', {
      matchId: match._id,
      status: 'cancelled',
      resultSummary: match.resultSummary,
    });
  }

  successResponse(res, match, 'Match abandoned successfully');
};

/* ─── Live Scorecard Aggregation (Phase 3.3) ──────────────────────────────── */
exports.getScorecard = async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('teamA', 'name sport logo')
    .populate('teamB', 'name sport logo')
    .populate('groundId', 'name location');

  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

  if (match.sport === 'cricket') {
    const scorecard = generateCricketScorecard(match);
    return successResponse(res, scorecard);
  }

  // Non-cricket scoreboard
  successResponse(res, {
    matchId: match._id,
    sport: match.sport,
    status: match.status,
    scoreSummary: match.scoreSummary,
    events: match.events,
    resultSummary: match.resultSummary,
  });
};

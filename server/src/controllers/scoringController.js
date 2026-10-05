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

  if (isLegalBall) {
    inning.overs = parseFloat(((currentBalls + 1) / 6).toFixed(1));
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

  successResponse(res, { scorerId: match.scorerId }, 'Successfully taken over scoring');
};

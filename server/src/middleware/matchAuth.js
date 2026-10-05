const Match = require('../models/Match');

exports.authorizeMatchOp = async (req, res, next) => {
  try {
    const matchId = req.params.id;
    if (!matchId) return res.status(400).json({ success: false, message: 'Match ID is required' });

    const match = await Match.findById(matchId).populate('teamA').populate('teamB');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    req.match = match;

    if (match.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Match is already completed' });
    }

    let isAuthorized = false;
    const userId = req.user ? req.user._id.toString() : null;

    if (req.user && req.user.role === 'admin') {
      isAuthorized = true;
    }

    if (!isAuthorized && match.scorerId && match.scorerId.toString() === userId) {
      isAuthorized = true;
    }

    if (!isAuthorized && userId && match.teamA && match.teamB) {
      const teamA = match.teamA;
      const teamB = match.teamB;
      if (teamA.captainId?.toString() === userId || teamA.viceCaptainId?.toString() === userId || (teamA.players && teamA.players.some(p => p.toString() === userId))) {
        isAuthorized = true;
      }
      if (teamB.captainId?.toString() === userId || teamB.viceCaptainId?.toString() === userId || (teamB.players && teamB.players.some(p => p.toString() === userId))) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Only participating teams or match officials may operate this match' });
    }

    const now = new Date();
    const isScoringRoute = req.originalUrl.includes('/scoring/') && req.method === 'POST';
    
    if (isScoringRoute && !req.originalUrl.includes('/setup') && !req.originalUrl.includes('/takeover')) {
      if (match.status !== 'live') {
        return res.status(400).json({ success: false, message: 'Match is not live' });
      }

      if (match.scorerId && match.scorerId.toString() !== userId) {
        const lockAgeMs = match.scorerLockedAt ? now - match.scorerLockedAt : 0;
        if (lockAgeMs < 5 * 60 * 1000) {
          return res.status(403).json({ success: false, message: 'Scoring is currently locked to another scorer. Second device is read-only.' });
        }
      }
      
      await Match.findByIdAndUpdate(matchId, {
        scorerId: userId,
        scorerLockedAt: now
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error authorizing match operation', error: error.message });
  }
};

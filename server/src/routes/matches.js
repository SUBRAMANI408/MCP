const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getMatches,
  getMatch,
  startMatch,
  addMatchEvent,
  completeMatch,
  getMatchSummary,
  getLiveMatches,
} = require('../controllers/matchController');

router.use(authenticate);

router.get('/', getMatches);
router.get('/live', getLiveMatches);
router.get('/:id', getMatch);
router.get('/:id/summary', getMatchSummary);
router.post('/:id/start', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), startMatch);
router.post('/:id/event', authorize('captain', 'vice_captain', 'player', 'tournament_organizer'), addMatchEvent);
router.put('/:id/complete', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), completeMatch);

module.exports = router;

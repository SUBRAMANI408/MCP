const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  setupMatch, cricketBall, switchInnings,
  footballEvent, volleyballSet, genericEvent, setPlayerOfMatch,
  takeoverScoring, selectBatsman, selectBowler, swapStrike, undoLastBall, abandonMatch, getScorecard,
} = require('../controllers/scoringController');

const { authorizeMatchOp } = require('../middleware/matchAuth');

router.use(authenticate);

const scorers = ['captain', 'vice_captain', 'player', 'tournament_organizer', 'admin'];

router.post('/setup', authorize(...scorers), setupMatch);
router.get('/:id/scorecard', getScorecard);
router.post('/:id/cricket/ball', authorize(...scorers), authorizeMatchOp, cricketBall);
router.delete('/:id/cricket/last-ball', authorize(...scorers), authorizeMatchOp, undoLastBall);
router.post('/:id/cricket/select-batsman', authorize(...scorers), authorizeMatchOp, selectBatsman);
router.post('/:id/cricket/select-bowler', authorize(...scorers), authorizeMatchOp, selectBowler);
router.post('/:id/cricket/swap-strike', authorize(...scorers), authorizeMatchOp, swapStrike);
router.post('/:id/cricket/switch-innings', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), authorizeMatchOp, switchInnings);
router.post('/:id/football/event', authorize(...scorers), authorizeMatchOp, footballEvent);
router.post('/:id/volleyball/set', authorize(...scorers), authorizeMatchOp, volleyballSet);
router.post('/:id/event', authorize(...scorers), authorizeMatchOp, genericEvent);
router.post('/:id/takeover', authorize(...scorers), authorizeMatchOp, takeoverScoring);
router.post('/:id/abandon', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), authorizeMatchOp, abandonMatch);
router.put('/:id/player-of-match', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), authorizeMatchOp, setPlayerOfMatch);

module.exports = router;

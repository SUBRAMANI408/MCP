const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  setupMatch, cricketBall, switchInnings,
  footballEvent, volleyballSet, genericEvent, setPlayerOfMatch,
} = require('../controllers/scoringController');

const { authorizeMatchOp } = require('../middleware/matchAuth');

router.use(authenticate);

const scorers = ['captain', 'vice_captain', 'player', 'tournament_organizer', 'admin'];

router.post('/setup', authorize(...scorers), setupMatch);
router.post('/:id/cricket/ball', authorize(...scorers), authorizeMatchOp, cricketBall);
router.post('/:id/cricket/switch-innings', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), authorizeMatchOp, switchInnings);
router.post('/:id/football/event', authorize(...scorers), authorizeMatchOp, footballEvent);
router.post('/:id/volleyball/set', authorize(...scorers), authorizeMatchOp, volleyballSet);
router.post('/:id/event', authorize(...scorers), authorizeMatchOp, genericEvent);
router.post('/:id/takeover', authorize(...scorers), authorizeMatchOp, require('../controllers/scoringController').takeoverScoring);
router.put('/:id/player-of-match', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), authorizeMatchOp, setPlayerOfMatch);

module.exports = router;

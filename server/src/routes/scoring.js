const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  setupMatch, cricketBall, switchInnings,
  footballEvent, volleyballSet, genericEvent, setPlayerOfMatch,
} = require('../controllers/scoringController');

router.use(authenticate);

const scorers = ['captain', 'vice_captain', 'player', 'tournament_organizer', 'admin'];

router.post('/setup', authorize(...scorers), setupMatch);
router.post('/:id/cricket/ball', authorize(...scorers), cricketBall);
router.post('/:id/cricket/switch-innings', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), switchInnings);
router.post('/:id/football/event', authorize(...scorers), footballEvent);
router.post('/:id/volleyball/set', authorize(...scorers), volleyballSet);
router.post('/:id/event', authorize(...scorers), genericEvent);
router.put('/:id/player-of-match', authorize('captain', 'vice_captain', 'tournament_organizer', 'admin'), setPlayerOfMatch);

module.exports = router;

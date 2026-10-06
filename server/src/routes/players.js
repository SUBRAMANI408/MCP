const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getPlayerStats, getLeaderboards } = require('../controllers/playerController');

router.use(authenticate);

router.get('/leaderboards', getLeaderboards);
router.get('/:id/stats', getPlayerStats);

module.exports = router;

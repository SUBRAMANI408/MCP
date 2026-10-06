const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAssociation, docAssociationGuard } = require('../middleware/scope');
const User = require('../models/User');
const { getPlayerStats, getLeaderboards } = require('../controllers/playerController');

router.use(authenticate);

router.get('/leaderboards', requireAssociation('associationId'), getLeaderboards);
router.get('/:id/stats', docAssociationGuard(User, 'id'), getPlayerStats);

module.exports = router;

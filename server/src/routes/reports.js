const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getReport } = require('../controllers/reportController');

router.use(authenticate);

router.get('/:role/:reportType', authorize('admin', 'association_head', 'tournament_organizer', 'funds_officer', 'ground_officer', 'captain'), getReport);

module.exports = router;

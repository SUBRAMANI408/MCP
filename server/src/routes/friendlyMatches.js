const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  sendFriendlyRequest,
  getFriendlyMatches,
  getFriendlyMatch,
  acceptFriendlyMatch,
  rejectFriendlyMatch,
  cancelFriendlyMatch,
  rescheduleFriendlyMatch,
} = require('../controllers/friendlyMatchController');

router.use(authenticate);

router.post('/', authorize('captain', 'vice_captain'), [
  body('respondingTeamId').isMongoId(),
  body('sport').notEmpty(),
], validate, sendFriendlyRequest);

router.get('/', getFriendlyMatches);
router.get('/:id', getFriendlyMatch);
router.put('/:id/accept', authorize('captain', 'vice_captain'), acceptFriendlyMatch);
router.put('/:id/reject', authorize('captain', 'vice_captain'), rejectFriendlyMatch);
router.put('/:id/reschedule', authorize('captain', 'vice_captain'), rescheduleFriendlyMatch);
router.delete('/:id', authorize('captain'), cancelFriendlyMatch);

module.exports = router;

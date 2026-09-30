const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createTeam,
  getTeam,
  updateTeam,
  invitePlayer,
  removePlayer,
  promoteViceCaptain,
  getTeamsByAssociation,
  getMyTeam,
  submitForApproval,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
} = require('../controllers/teamController');

router.use(authenticate);

router.get('/invitations/my', getMyInvitations);
router.put('/invitations/:inviteId/accept', acceptInvitation);
router.put('/invitations/:inviteId/reject', rejectInvitation);

router.post('/', authorize('captain'), [
  body('name').notEmpty().trim(),
  body('sport').notEmpty(),
  body('associationId').isMongoId(),
], validate, createTeam);

router.get('/my-team', getMyTeam);
router.get('/', getTeamsByAssociation);
router.get('/:id', getTeam);
router.put('/:id', authorize('captain', 'association_head', 'admin'), updateTeam);
router.post('/:id/invite', authorize('captain', 'vice_captain'), invitePlayer);
router.delete('/:id/players/:playerId', authorize('captain'), removePlayer);
router.put('/:id/promote-vice-captain', authorize('captain'), promoteViceCaptain);
router.put('/:id/submit-approval', authorize('captain'), submitForApproval);

module.exports = router;

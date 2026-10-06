const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireAssociation, docAssociationGuard } = require('../middleware/scope');
const Team = require('../models/Team');
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
  getTeamPlayers,
} = require('../controllers/teamController');

router.use(authenticate);

router.get('/invitations/my', getMyInvitations);
router.put('/invitations/:inviteId/accept', acceptInvitation);
router.put('/invitations/:inviteId/reject', rejectInvitation);

router.post('/', authorize('captain', 'admin'), requireAssociation('associationId'), [
  body('name').notEmpty().trim(),
  body('sport').notEmpty(),
  body('associationId').isMongoId(),
], validate, createTeam);

router.get('/my-team', getMyTeam);
router.get('/', requireAssociation('associationId'), getTeamsByAssociation);
router.get('/:id', docAssociationGuard(Team, 'id'), getTeam);
router.get('/:id/players', docAssociationGuard(Team, 'id'), getTeamPlayers);
router.put('/:id', authorize('captain', 'association_head', 'admin'), docAssociationGuard(Team, 'id'), updateTeam);
router.post('/:id/invite', authorize('captain', 'vice_captain'), docAssociationGuard(Team, 'id'), invitePlayer);
router.delete('/:id/players/:playerId', authorize('captain'), docAssociationGuard(Team, 'id'), removePlayer);
router.put('/:id/promote-vice-captain', authorize('captain'), docAssociationGuard(Team, 'id'), promoteViceCaptain);
router.put('/:id/submit-approval', authorize('captain'), docAssociationGuard(Team, 'id'), submitForApproval);

module.exports = router;

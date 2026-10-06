const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireAssociation, docAssociationGuard } = require('../middleware/scope');
const Team = require('../models/Team');
const {
  getAssociationDashboard,
  createOrganizer,
  createGroundOfficer,
  createFundsOfficer,
  updateOfficer,
  deleteOfficer,
  assignTemporaryOrganizer,
  revokeTemporaryOrganizer,
  getAssociationTeams,
  getAssociationMembers,
  approveTeam,
  rejectTeam,
  requestCorrections,
  suspendTeam,
  reactivateTeam,
  getAssociation,
  updateAssociation,
  getAssociations,
} = require('../controllers/associationController');

router.use(authenticate);

router.get('/', getAssociations);
router.get('/:id/dashboard', authorize('admin', 'association_head'), requireAssociation('id'), getAssociationDashboard);
router.get('/:id', requireAssociation('id'), getAssociation);
router.put('/:id', authorize('admin', 'association_head'), requireAssociation('id'), updateAssociation);
router.get('/:id/teams', requireAssociation('id'), getAssociationTeams);
router.get('/:id/members', authorize('admin', 'association_head'), requireAssociation('id'), getAssociationMembers);

// Officer creation
router.post('/:id/organizers', authorize('admin', 'association_head'), requireAssociation('id'), createOrganizer);
router.post('/:id/ground-officers', authorize('admin', 'association_head'), requireAssociation('id'), createGroundOfficer);
router.post('/:id/funds-officers', authorize('admin', 'association_head'), requireAssociation('id'), createFundsOfficer);

// Officer modification & deletion
router.put('/:id/officers/:officerId', authorize('admin', 'association_head'), requireAssociation('id'), updateOfficer);
router.delete('/:id/officers/:officerId', authorize('admin', 'association_head'), requireAssociation('id'), deleteOfficer);

// Temporary organizer assignment
router.post('/:id/temp-organizer', authorize('admin', 'association_head'), requireAssociation('id'), assignTemporaryOrganizer);
router.delete('/:id/temp-organizer/:captainId', authorize('admin', 'association_head'), requireAssociation('id'), revokeTemporaryOrganizer);

// Team management actions
router.put('/teams/:teamId/approve', authorize('admin', 'association_head'), docAssociationGuard(Team, 'teamId'), approveTeam);
router.put('/teams/:teamId/reject', authorize('admin', 'association_head'), docAssociationGuard(Team, 'teamId'), rejectTeam);
router.put('/teams/:teamId/request-corrections', authorize('admin', 'association_head'), docAssociationGuard(Team, 'teamId'), requestCorrections);
router.put('/teams/:teamId/suspend', authorize('admin', 'association_head'), docAssociationGuard(Team, 'teamId'), suspendTeam);
router.put('/teams/:teamId/reactivate', authorize('admin', 'association_head'), docAssociationGuard(Team, 'teamId'), reactivateTeam);

module.exports = router;

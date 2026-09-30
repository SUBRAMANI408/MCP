const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
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
  suspendTeam,
  reactivateTeam,
  getAssociation,
  updateAssociation,
  getAssociations,
} = require('../controllers/associationController');

router.use(authenticate);

router.get('/', getAssociations);
router.get('/:id/dashboard', authorize('admin', 'association_head'), getAssociationDashboard);
router.get('/:id', getAssociation);
router.put('/:id', authorize('admin', 'association_head'), updateAssociation);
router.get('/:id/teams', getAssociationTeams);
router.get('/:id/members', authorize('admin', 'association_head'), getAssociationMembers);

// Officer creation
router.post('/:id/organizers', authorize('admin', 'association_head'), createOrganizer);
router.post('/:id/ground-officers', authorize('admin', 'association_head'), createGroundOfficer);
router.post('/:id/funds-officers', authorize('admin', 'association_head'), createFundsOfficer);

// Officer modification & deletion
router.put('/:id/officers/:officerId', authorize('admin', 'association_head'), updateOfficer);
router.delete('/:id/officers/:officerId', authorize('admin', 'association_head'), deleteOfficer);

// Temporary organizer assignment
router.post('/:id/temp-organizer', authorize('admin', 'association_head'), assignTemporaryOrganizer);
router.delete('/:id/temp-organizer/:captainId', authorize('admin', 'association_head'), revokeTemporaryOrganizer);

// Team management actions
router.put('/teams/:teamId/approve', authorize('admin', 'association_head'), approveTeam);
router.put('/teams/:teamId/reject', authorize('admin', 'association_head'), rejectTeam);
router.put('/teams/:teamId/suspend', authorize('admin', 'association_head'), suspendTeam);
router.put('/teams/:teamId/reactivate', authorize('admin', 'association_head'), reactivateTeam);

module.exports = router;

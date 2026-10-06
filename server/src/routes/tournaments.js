const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireAssociation, docAssociationGuard } = require('../middleware/scope');
const Tournament = require('../models/Tournament');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  submitForApproval,
  approveTournament,
  rejectTournament,
  registerTeam,
  unregisterTeam,
  generateFixtures,
  getTournamentReports,
  startTournament,
  completeTournament,
  getTournamentOrganizerDashboard,
  getTournamentStandings,
  getTournamentRegistrations,
  reviewTournamentRegistration,
} = require('../controllers/tournamentController');

router.use(authenticate);

router.get('/dashboard', authorize('tournament_organizer', 'admin'), getTournamentOrganizerDashboard);

router.post('/', authorize('tournament_organizer', 'admin'), requireAssociation('associationId'), [
  body('name').notEmpty().trim(),
  body('sport').notEmpty(),
  body('associationId').isMongoId(),
], validate, createTournament);

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/:id/standings', getTournamentStandings);
router.get('/:id/reports', getTournamentReports);
router.put('/:id', authorize('tournament_organizer', 'admin'), docAssociationGuard(Tournament, 'id'), updateTournament);
router.put('/:id/submit', authorize('tournament_organizer'), docAssociationGuard(Tournament, 'id'), submitForApproval);
router.put('/:id/approve', authorize('association_head', 'admin'), docAssociationGuard(Tournament, 'id'), approveTournament);
router.put('/:id/reject', authorize('association_head', 'admin'), docAssociationGuard(Tournament, 'id'), rejectTournament);
router.post('/:id/register', authorize('captain'), docAssociationGuard(Tournament, 'id'), registerTeam);
router.delete('/:id/register', authorize('captain'), docAssociationGuard(Tournament, 'id'), unregisterTeam);
router.get('/:id/registrations', authorize('tournament_organizer', 'admin', 'association_head'), docAssociationGuard(Tournament, 'id'), getTournamentRegistrations);
router.put('/:id/registrations/:regId', authorize('tournament_organizer', 'admin'), docAssociationGuard(Tournament, 'id'), reviewTournamentRegistration);
router.post('/:id/generate-fixtures', authorize('tournament_organizer', 'admin'), docAssociationGuard(Tournament, 'id'), generateFixtures);
router.put('/:id/start', authorize('tournament_organizer', 'admin'), docAssociationGuard(Tournament, 'id'), startTournament);
router.put('/:id/complete', authorize('tournament_organizer', 'admin'), docAssociationGuard(Tournament, 'id'), completeTournament);

module.exports = router;

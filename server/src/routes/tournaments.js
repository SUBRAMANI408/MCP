const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
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

router.post('/', authorize('tournament_organizer', 'admin'), [
  body('name').notEmpty().trim(),
  body('sport').notEmpty(),
  body('associationId').isMongoId(),
], validate, createTournament);

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.get('/:id/standings', getTournamentStandings);
router.get('/:id/reports', getTournamentReports);
router.put('/:id', authorize('tournament_organizer', 'admin'), updateTournament);
router.put('/:id/submit', authorize('tournament_organizer'), submitForApproval);
router.put('/:id/approve', authorize('association_head', 'admin'), approveTournament);
router.put('/:id/reject', authorize('association_head', 'admin'), rejectTournament);
router.post('/:id/register', authorize('captain'), registerTeam);
router.delete('/:id/register', authorize('captain'), unregisterTeam);
router.get('/:id/registrations', authorize('tournament_organizer', 'admin', 'association_head'), getTournamentRegistrations);
router.put('/:id/registrations/:regId', authorize('tournament_organizer', 'admin'), reviewTournamentRegistration);
router.post('/:id/generate-fixtures', authorize('tournament_organizer', 'admin'), generateFixtures);
router.put('/:id/start', authorize('tournament_organizer', 'admin'), startTournament);
router.put('/:id/complete', authorize('tournament_organizer', 'admin'), completeTournament);

module.exports = router;

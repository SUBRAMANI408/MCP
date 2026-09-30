const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getFixtures,
  getFixture,
  scheduleFixture,
  updateFixture,
} = require('../controllers/fixtureController');

router.use(authenticate);

router.get('/', getFixtures);
router.get('/:id', getFixture);
router.put('/:id/schedule', authorize('tournament_organizer', 'admin'), [
  body('groundId').isMongoId(),
  body('scheduledDate').isDate(),
  body('scheduledTime').notEmpty(),
], validate, scheduleFixture);
router.put('/:id', authorize('tournament_organizer', 'admin'), updateFixture);

module.exports = router;

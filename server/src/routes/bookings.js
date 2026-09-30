const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createBooking,
  getBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  getCalendar,
  getBookingReports,
  getGroundOfficerDashboard,
} = require('../controllers/bookingController');

router.use(authenticate);

router.get('/dashboard', authorize('ground_officer', 'admin'), getGroundOfficerDashboard);

router.post('/', authorize('captain', 'vice_captain'), [
  body('groundId').isMongoId(),
  body('teamId').isMongoId(),
  body('date').isDate(),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
], validate, createBooking);

router.get('/', getBookings);
router.get('/calendar', getCalendar);
router.get('/reports', authorize('admin', 'association_head', 'ground_officer'), getBookingReports);
router.get('/:id', getBooking);
router.put('/:id/approve', authorize('ground_officer', 'admin', 'association_head'), approveBooking);
router.put('/:id/reject', authorize('ground_officer', 'admin', 'association_head'), rejectBooking);

module.exports = router;

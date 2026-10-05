const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createExpenseRequest,
  getExpenseRequests,
  getExpenseRequest,
  reviewExpenseRequest,
  payExpenseRequest,
} = require('../controllers/expenseController');

router.use(authenticate);

router.post('/', authorize('captain', 'tournament_organizer', 'funds_officer', 'association_head', 'admin'), createExpenseRequest);
router.get('/', authorize('funds_officer', 'association_head', 'admin', 'captain', 'tournament_organizer'), getExpenseRequests);
router.get('/:id', getExpenseRequest);
router.put('/:id/review', authorize('association_head', 'admin'), reviewExpenseRequest);
router.post('/:id/pay', authorize('funds_officer', 'admin'), payExpenseRequest);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireAssociation, docAssociationGuard } = require('../middleware/scope');
const ExpenseRequest = require('../models/ExpenseRequest');
const {
  createExpenseRequest,
  getExpenseRequests,
  getExpenseRequest,
  reviewExpenseRequest,
  payExpenseRequest,
} = require('../controllers/expenseController');

router.use(authenticate);

router.post('/', authorize('captain', 'tournament_organizer', 'funds_officer', 'association_head', 'admin'), requireAssociation('associationId'), createExpenseRequest);
router.get('/', authorize('funds_officer', 'association_head', 'admin', 'captain', 'tournament_organizer'), requireAssociation('associationId'), getExpenseRequests);
router.get('/:id', docAssociationGuard(ExpenseRequest), getExpenseRequest);
router.put('/:id/review', authorize('association_head', 'admin'), docAssociationGuard(ExpenseRequest), reviewExpenseRequest);
router.post('/:id/pay', authorize('funds_officer', 'admin'), docAssociationGuard(ExpenseRequest), payExpenseRequest);

module.exports = router;

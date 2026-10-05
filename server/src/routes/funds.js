const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireAssociation, docAssociationGuard } = require('../middleware/scope');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Fund = require('../models/Fund');
const {
  collectIncome,
  createExpenseRequest,
  getFunds,
  getFund,
  getBalance,
  approveExpense,
  rejectExpense,
  getFinancialReports,
  getDashboard,
} = require('../controllers/fundController');

router.use(authenticate);

router.post('/income', authorize('funds_officer', 'admin'), requireAssociation('associationId'), [
  body('associationId').isMongoId(),
  body('category').isIn(['membership_fee', 'tournament_fee', 'sponsorship', 'donation', 'other']),
  body('amount').isNumeric().isFloat({ min: 0 }),
  body('description').notEmpty(),
], validate, collectIncome);

router.post('/expense-request', authorize('funds_officer', 'admin'), requireAssociation('associationId'), [
  body('associationId').isMongoId(),
  body('amount').isNumeric().isFloat({ min: 0 }),
  body('description').notEmpty(),
], validate, createExpenseRequest);

router.get('/', getFunds);
router.get('/dashboard', getDashboard);
router.get('/:associationId/balance', authorize('admin', 'association_head', 'funds_officer'), requireAssociation('associationId'), getBalance);
router.get('/:associationId/reports', authorize('admin', 'association_head', 'funds_officer'), requireAssociation('associationId'), getFinancialReports);
router.get('/:id', docAssociationGuard(Fund), getFund);
router.put('/expenses/:id/approve', authorize('association_head', 'admin'), docAssociationGuard(Fund), approveExpense);
router.put('/expenses/:id/reject', authorize('association_head', 'admin'), docAssociationGuard(Fund), rejectExpense);
router.post('/:id/retry-receipt', authorize('funds_officer', 'admin'), docAssociationGuard(Fund), require('../controllers/fundController').retryReceipt);

module.exports = router;

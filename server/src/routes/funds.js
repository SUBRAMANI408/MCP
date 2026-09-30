const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  collectIncome,
  createExpenseRequest,
  getFunds,
  getFund,
  getBalance,
  approveExpense,
  rejectExpense,
  getFinancialReports,
} = require('../controllers/fundController');

router.use(authenticate);

router.post('/income', authorize('funds_officer', 'admin'), [
  body('associationId').isMongoId(),
  body('category').isIn(['membership_fee', 'tournament_fee', 'sponsorship', 'donation', 'other']),
  body('amount').isNumeric().isFloat({ min: 0 }),
  body('description').notEmpty(),
], validate, collectIncome);

router.post('/expense-request', authorize('funds_officer', 'admin'), [
  body('associationId').isMongoId(),
  body('amount').isNumeric().isFloat({ min: 0 }),
  body('description').notEmpty(),
], validate, createExpenseRequest);

router.get('/', getFunds);
router.get('/:associationId/balance', authorize('admin', 'association_head', 'funds_officer'), getBalance);
router.get('/:associationId/reports', authorize('admin', 'association_head', 'funds_officer'), getFinancialReports);
router.get('/:id', getFund);
router.put('/expenses/:id/approve', authorize('association_head', 'admin'), approveExpense);
router.put('/expenses/:id/reject', authorize('association_head', 'admin'), rejectExpense);

module.exports = router;

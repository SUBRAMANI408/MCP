const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getReceipt, getReceipts, downloadReceipt } = require('../controllers/receiptController');

router.use(authenticate);

router.get('/', authorize('admin', 'association_head', 'funds_officer'), getReceipts);
router.get('/:id', getReceipt);
router.get('/:id/download', downloadReceipt);

module.exports = router;

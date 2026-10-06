const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAssociation } = require('../middleware/scope');
const { createOrder, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');

router.use(authenticate);

router.post('/order', requireAssociation('associationId'), createOrder);
router.post('/verify', verifyPayment);
router.get('/history', requireAssociation('associationId'), getPaymentHistory);

module.exports = router;

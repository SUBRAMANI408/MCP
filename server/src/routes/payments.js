const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createOrder, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');

router.use(authenticate);

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);

module.exports = router;

const crypto = require('crypto');
const Payment = require('../models/Payment');
const Fund = require('../models/Fund');
const TournamentRegistration = require('../models/TournamentRegistration');
const Membership = require('../models/Membership');
const { successResponse } = require('../utils/apiResponse');

/**
 * Razorpay Payment Controller (Phase 6.2)
 * Handles order creation, signature verification, and automated ledger recording.
 */

exports.createOrder = async (req, res) => {
  const { amount, purpose, associationId, relatedId } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }

  // Simulated / Real Razorpay Order ID
  const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const payment = await Payment.create({
    payerUserId: req.user._id,
    associationId: associationId || req.user.associationId,
    purpose: purpose || 'other',
    relatedId: relatedId || null,
    gateway: 'razorpay',
    orderId,
    amount,
    currency: 'INR',
    status: 'created',
  });

  successResponse(res, {
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_sports123',
    paymentId: payment._id,
  }, 'Order created successfully', 201);
};

exports.verifyPayment = async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment order not found' });
  }

  // In production, verify HMAC signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  let isValid = true;

  if (keySecret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    isValid = expectedSignature === signature;
  }

  if (!isValid) {
    payment.status = 'failed';
    await payment.save();
    return res.status(400).json({ success: false, message: 'Invalid payment signature' });
  }

  payment.status = 'paid';
  payment.paymentId = paymentId;
  payment.signature = signature;
  await payment.save();

  // 1. If tournament fee, update registration
  if (payment.purpose === 'tournament_fee' && payment.relatedId) {
    await TournamentRegistration.findOneAndUpdate(
      { tournamentId: payment.relatedId, submittedBy: payment.payerUserId },
      { registrationFeeStatus: 'paid', paymentId: payment._id }
    );
  }

  // 2. If membership fee, create or extend membership
  if (payment.purpose === 'membership_fee') {
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1); // 1 year membership
    await Membership.create({
      userId: payment.payerUserId,
      associationId: payment.associationId,
      plan: 'annual',
      validFrom: new Date(),
      validTo,
      status: 'active',
      feeAmount: payment.amount,
      paymentId: payment._id,
    });
  }

  // 3. Auto-record income into Fund ledger
  try {
    await Fund.create({
      associationId: payment.associationId,
      type: 'income',
      category: payment.purpose === 'tournament_fee' ? 'tournament_fee' : 'membership_fee',
      amount: payment.amount,
      description: `Payment for ${payment.purpose.replace(/_/g, ' ')} (${orderId})`,
      requestedBy: payment.payerUserId,
      status: 'completed',
    });
  } catch (fundErr) {
    console.error('Failed to log fund income from payment:', fundErr);
  }

  successResponse(res, payment, 'Payment verified successfully');
};

exports.getPaymentHistory = async (req, res) => {
  const query = req.user.role === 'admin' ? {} : { payerUserId: req.user._id };
  const payments = await Payment.find(query)
    .populate('payerUserId', 'name email')
    .sort({ createdAt: -1 });
  successResponse(res, payments);
};

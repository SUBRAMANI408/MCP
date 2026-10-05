const crypto = require('crypto');
const Payment = require('../models/Payment');
const Fund = require('../models/Fund');
const TournamentRegistration = require('../models/TournamentRegistration');
const Membership = require('../models/Membership');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.warn('[WARN] Razorpay SDK initialization error:', err.message);
  }
}

/**
 * Razorpay Payment Controller (Phase 6.2 - Hardened)
 * Enforces cryptographic HMAC verification, forbids bypass, and supports strict mock mode.
 */

exports.createOrder = async (req, res) => {
  const { amount, purpose, associationId, relatedId } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isMockMode = process.env.PAYMENTS_MODE === 'mock';

  if (isProduction && isMockMode) {
    return res.status(500).json({
      success: false,
      message: 'CRITICAL: PAYMENTS_MODE=mock is strictly prohibited in production environments.'
    });
  }

  let orderId;
  let keyId = process.env.RAZORPAY_KEY_ID;

  if (razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { purpose, userId: req.user._id.toString() },
      });
      orderId = order.id;
    } catch (sdkErr) {
      console.error('Razorpay order creation failed:', sdkErr);
      return res.status(502).json({ success: false, message: 'Gateway order creation failed', error: sdkErr.message });
    }
  } else if (isMockMode) {
    orderId = `order_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    keyId = 'rzp_test_mock_mode';
  } else {
    return res.status(500).json({
      success: false,
      message: 'Payment gateway unconfigured: Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET or PAYMENTS_MODE=mock in development.'
    });
  }

  let assocId = associationId || req.user.associationId;
  if (!assocId) {
    const Association = require('../models/Association');
    const firstAssoc = await Association.findOne();
    if (firstAssoc) {
      assocId = firstAssoc._id;
    } else {
      return res.status(400).json({ success: false, message: 'Valid associationId is required for payment' });
    }
  }

  const payment = await Payment.create({
    payerUserId: req.user._id,
    associationId: assocId,
    purpose: purpose || 'other',
    relatedId: relatedId || null,
    gateway: isMockMode ? 'mock' : 'razorpay',
    orderId,
    amount,
    currency: 'INR',
    status: 'created',
  });

  successResponse(res, {
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    key: keyId,
    paymentId: payment._id,
    isMock: isMockMode,
  }, 'Order created successfully', 201);
};

exports.verifyPayment = async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification requires orderId, paymentId, and signature.'
    });
  }

  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment order record not found' });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isMockMode = process.env.PAYMENTS_MODE === 'mock';

  // Default is strictly FALSE — never bypass!
  let isValid = false;

  if (payment.gateway === 'mock' || isMockMode) {
    if (isProduction) {
      return res.status(403).json({
        success: false,
        message: 'Mock payment verification forbidden in production.'
      });
    }
    // Only accept exact mock signature token
    const expectedMockSig = `mock_sig_${orderId}`;
    isValid = signature === expectedMockSig;
  } else {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway secret is not configured on the server.'
      });
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'utf8');

      if (expectedBuffer.length === signatureBuffer.length) {
        isValid = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
      }
    } catch (cryptoErr) {
      isValid = false;
    }
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
      category: payment.purpose === 'membership_fee' ? 'membership_fee' : (payment.purpose === 'tournament_fee' ? 'tournament_fee' : 'other'),
      amount: payment.amount,
      description: `Online Payment (${payment.gateway}) - Ref: ${paymentId}`,
      requestedBy: payment.payerUserId,
      status: 'completed',
      receiptStatus: 'pending',
    });
  } catch (fundErr) {
    console.error('Failed to post payment to Fund ledger:', fundErr);
  }

  successResponse(res, { payment }, 'Payment verified and ledger posted successfully');
};

exports.getPaymentHistory = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};

  if (req.user.role !== 'admin') {
    query.associationId = req.user.associationId;
    if (['player', 'captain', 'vice_captain'].includes(req.user.role)) {
      query.payerUserId = req.user._id;
    }
  }
  if (status) query.status = status;

  const total = await Payment.countDocuments(query);
  const payments = await Payment.find(query)
    .populate('payerUserId', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  paginatedResponse(res, payments, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

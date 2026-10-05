const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true, index: true },
  purpose: {
    type: String,
    enum: ['tournament_fee', 'membership_fee', 'ground_fee', 'team_fee', 'donation', 'other'],
    required: true,
  },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null }, // e.g. tournamentId, bookingId
  gateway: { type: String, default: 'razorpay' },
  orderId: { type: String, required: true, unique: true, index: true },
  paymentId: { type: String, default: null, index: true },
  signature: { type: String, default: null },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created',
    index: true,
  },
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null },
  webhookPayload: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

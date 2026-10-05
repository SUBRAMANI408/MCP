const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true, index: true },
  plan: {
    type: String,
    enum: ['annual', 'quarterly', 'monthly', 'lifetime'],
    default: 'annual',
  },
  validFrom: { type: Date, default: Date.now },
  validTo: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'grace_period'],
    default: 'active',
    index: true,
  },
  feeAmount: { type: Number, required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
}, { timestamps: true });

membershipSchema.index({ userId: 1, associationId: 1 });

module.exports = mongoose.model('Membership', membershipSchema);

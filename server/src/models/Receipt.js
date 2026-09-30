const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  fundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fund', required: true },
  receiptNumber: { type: String, required: true, unique: true },
  issuedTo: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  pdfUrl: { type: String },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);

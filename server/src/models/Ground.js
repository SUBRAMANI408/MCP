const mongoose = require('mongoose');

const groundSchema = new mongoose.Schema({
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true },
  name: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  sportsSupported: [{ type: String }],
  capacity: { type: Number, default: 0 },
  description: { type: String, trim: true },
  bookingEnabled: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'maintenance'], default: 'active' },
  images: [{ type: String }],
  maintenanceWindows: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, default: 'Scheduled maintenance' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Ground', groundSchema);

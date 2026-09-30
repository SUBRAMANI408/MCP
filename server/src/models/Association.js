const mongoose = require('mongoose');

const associationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  headUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, trim: true },
  logo: { type: String, default: null },
  grounds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ground' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  description: { type: String, default: '' },
  contactInfo: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  socialLinks: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Association', associationSchema);

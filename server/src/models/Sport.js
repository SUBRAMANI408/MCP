const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  scoringSchema: {
    fields: [{
      key: String,
      label: String,
      type: { type: String, enum: ['number', 'text', 'boolean', 'select'] },
      options: [String],
      required: Boolean,
    }],
    rules: { type: String },
  },
  isActive: { type: Boolean, default: true },
  icon: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Sport', sportSchema);

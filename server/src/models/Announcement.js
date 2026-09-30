const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', default: null },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  type: { type: String, enum: ['general', 'maintenance', 'holiday', 'sports_event'], default: 'general' },
  scheduledAt: { type: Date, default: null },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);

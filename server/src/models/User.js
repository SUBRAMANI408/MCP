const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true, default: undefined },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['admin', 'association_head', 'tournament_organizer', 'captain', 'vice_captain', 'ground_officer', 'funds_officer', 'player'],
    required: true
  },
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', default: null },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  avatar: { type: String, default: null },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending'], default: 'active' },
  lastLogin: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  forcePasswordChange: { type: Boolean, default: false },
  tempOrganizer: {
    isTemp: { type: Boolean, default: false },
    assignedDate: { type: Date, default: null },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    reason: { type: String, default: null },
    status: { type: String, enum: ['active', 'expired', 'revoked'], default: 'active' }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const astrologerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    password: { type: String },
    image: { type: String },
    specialty: { type: String },
    bio: { type: String },
    rating: { type: Number, default: 4.5 },
    pricePerMin: { type: Number, required: true },
    originalPrice: { type: Number },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    isNew: { type: Boolean, default: false },
    experience: { type: Number },
    orders: { type: Number, default: 0 },
    languages: [{ type: String }],
    badge: { type: String },
    waitTime: { type: String },
    specialOffer: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    callEnabled: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    approvedViaApplication: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

astrologerSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

astrologerSchema.methods.matchPassword = function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Astrologer', astrologerSchema);
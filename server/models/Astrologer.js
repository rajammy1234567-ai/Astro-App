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
    pricingPackages: [{
      minutes: { type: Number, required: true },
      price: { type: Number, required: true },
    }],
    gallery: [{ type: String }],
    originalPrice: { type: Number },
    /** Master online (true if chatOnline OR callOnline) */
    isOnline: { type: Boolean, default: false },
    /** Available specifically for chat requests (user chat list) */
    chatOnline: { type: Boolean, default: false },
    /** Available specifically for call requests (user call list) */
    callOnline: { type: Boolean, default: false },
    /** When last went online (any mode) — for online-time tracking */
    onlineSince: { type: Date, default: null },
    /** Cumulative seconds spent Online on the app */
    totalOnlineSeconds: { type: Number, default: 0 },
    isLive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    isNew: { type: Boolean, default: false },
    experience: { type: Number },
    orders: { type: Number, default: 0 },
    languages: [{ type: String }],
    badge: { type: String },
    waitTime: { type: String },
    specialOffer: { type: Boolean, default: false },
    /** Capability flags (admin can disable service type permanently) */
    chatEnabled: { type: Boolean, default: true },
    callEnabled: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String },
    blockedAt: { type: Date },
    /**
     * When false, login ID/password is deactivated — cannot sign into partner app.
     * Admin can re-activate later. Separate from isBlocked (listing ban).
     */
    credentialsActive: { type: Boolean, default: true },
    credentialsDeactivatedAt: { type: Date },
    credentialsDeactivatedReason: { type: String },
    approvedViaApplication: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    /**
     * Pooja/remedy money is held by admin first.
     * pendingHeld = not yet released share (expected)
     * availableBalance = released by admin (can withdraw later)
     */
    pendingHeld: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    totalReleased: { type: Number, default: 0 },
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
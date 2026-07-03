const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'User' },
    phone: { type: String, sparse: true, unique: true },
    email: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    avatar: { type: String, default: 'https://i.pravatar.cc/150?img=47' },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String },
    blockedAt: { type: Date },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer' }],
    notifications: [
      {
        type: { type: String, default: 'info' },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    type: { type: String, enum: ['email', 'phone'], required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ identifier: 1, type: 1 });

module.exports = mongoose.model('Otp', otpSchema);
const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    amount: { type: Number, required: true },
    isRedeemed: { type: Boolean, default: false },
    redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    redeemedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GiftCard', giftCardSchema);
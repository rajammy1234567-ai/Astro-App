const mongoose = require('mongoose');

/**
 * Pooja / Remedy catalog.
 * - Platform listings: no astrologer (admin-created)
 * - Partner listings: created by an astrologer for users
 * All booking money is held by admin first; payout % released later.
 */
const poojaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    duration: { type: String, default: '1 hour' },
    price: { type: Number, required: true },
    icon: { type: String, default: 'flame-outline' },
    image: { type: String },
    /** pooja | remedy */
    serviceType: {
      type: String,
      enum: ['pooja', 'remedy'],
      default: 'pooja',
    },
    /** Offering astrologer (null = platform listing) */
    astrologer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      default: null,
    },
    /** Share of booking that can later go to astrologer (rest stays platform) */
    astrologerSharePercent: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

poojaSchema.index({ isActive: 1, serviceType: 1 });
poojaSchema.index({ astrologer: 1 });

module.exports = mongoose.model('Pooja', poojaSchema);

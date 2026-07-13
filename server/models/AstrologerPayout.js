const mongoose = require('mongoose');

/** Record when admin releases held pooja/remedy funds to an astrologer */
const astrologerPayoutSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    astrologer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      required: true,
    },
    amount: { type: Number, required: true },
    percentOfShare: { type: Number, default: 100 },
    note: { type: String },
    releasedByAdmin: { type: Boolean, default: true },
    earlyRelease: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AstrologerPayout', astrologerPayoutSchema);

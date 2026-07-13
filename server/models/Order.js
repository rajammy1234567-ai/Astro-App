const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderType: {
      type: String,
      enum: ['store', 'pooja', 'remedy'],
      default: 'store',
    },
    pooja: { type: mongoose.Schema.Types.ObjectId, ref: 'Pooja' },
    poojaName: { type: String },
    serviceType: {
      type: String,
      enum: ['pooja', 'remedy'],
    },
    /** Astrologer who provides the pooja/remedy */
    astrologer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      default: null,
    },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 },
        price: { type: Number },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'completed'],
      default: 'pending',
    },
    shippingAddress: { type: String },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'upi', 'gpay', 'card', 'razorpay'],
      default: 'wallet',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'paid',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    // ── Escrow / admin hold (pooja & remedy) ──────────────────────────
    /** Full amount held with admin/platform until payout */
    fundsHeldByAdmin: { type: Boolean, default: false },
    heldAmount: { type: Number, default: 0 },
    /** Expected % for astrologer when admin releases */
    astrologerSharePercent: { type: Number, default: 70 },
    /** Max amount that can be released to astrologer (share of total) */
    astrologerShareAmount: { type: Number, default: 0 },
    /** Already released to astrologer */
    releasedToAstrologer: { type: Number, default: 0 },
    /** held | partial | released | n/a */
    payoutStatus: {
      type: String,
      enum: ['n/a', 'held', 'partial', 'released'],
      default: 'n/a',
    },
    /** After this date admin typically releases (default +3 months) */
    payoutEligibleAt: { type: Date },
    payoutNote: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ astrologer: 1, payoutStatus: 1 });
orderSchema.index({ orderType: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

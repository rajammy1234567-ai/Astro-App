const mongoose = require('mongoose');

const astrologerReviewSchema = new mongoose.Schema(
  {
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    source: { type: String, enum: ['user', 'astrologer'], default: 'user' },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AstrologerReview', astrologerReviewSchema);
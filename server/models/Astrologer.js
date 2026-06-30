const mongoose = require('mongoose');

const astrologerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
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
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

module.exports = mongoose.model('Astrologer', astrologerSchema);
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'astrologer', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true },
    type: { type: String, enum: ['chat', 'call'], default: 'chat' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'active', 'paused', 'ended', 'rejected'],
      default: 'pending',
    },
    messages: [messageSchema],
    // Snapshot at booking time so astrologer always sees kundli details
    userBirthDetails: {
      name: { type: String, default: '' },
      dateOfBirth: { type: String, default: '' },
      timeOfBirth: { type: String, default: '' },
      placeOfBirth: { type: String, default: '' },
      gender: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
    pricePerMin: { type: Number, default: 20 },
    startedAt: { type: Date },
    acceptedAt: { type: Date },
    endedAt: { type: Date },
    lastTickAt: { type: Date },
    freeSecondsRemaining: { type: Number, default: 0 },
    paidSecondsRemaining: { type: Number, default: 0 },
    totalCharged: { type: Number, default: 0 },
    requiresPayment: { type: Boolean, default: false },
    callPaidUpfront: { type: Boolean, default: false },
    agoraChannel: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
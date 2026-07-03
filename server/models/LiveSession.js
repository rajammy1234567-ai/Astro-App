const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema(
  {
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true },
    title: { type: String, default: 'Live Session' },
    status: { type: String, enum: ['live', 'ended'], default: 'live' },
    channelName: { type: String, required: true, unique: true },
    viewerCount: { type: Number, default: 0 },
    isMuted: { type: Boolean, default: false },
    isCameraOff: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

liveSessionSchema.index({ status: 1, startedAt: -1 });
liveSessionSchema.index({ astrologer: 1, status: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
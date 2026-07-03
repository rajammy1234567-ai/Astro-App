const mongoose = require('mongoose');

const liveCommentSchema = new mongoose.Schema(
  {
    liveSession: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', required: true },
    authorType: { type: String, enum: ['user', 'astrologer'], required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveComment' },
  },
  { timestamps: true }
);

liveCommentSchema.index({ liveSession: 1, createdAt: 1 });

module.exports = mongoose.model('LiveComment', liveCommentSchema);
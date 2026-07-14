const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String },
    content: { type: String, required: true },
    image: { type: String },
    /** Display name (admin-written or astrologer name) */
    author: { type: String },
    /** When posted by an astrologer — links to their profile */
    authorAstrologer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      default: null,
      index: true,
    },
    /** Snapshot of author profile pic at post time (admin can also set) */
    authorImage: { type: String },
    views: { type: String, default: '0' },
    category: { type: String },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);

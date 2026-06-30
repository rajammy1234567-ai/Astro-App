const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String },
    content: { type: String, required: true },
    image: { type: String },
    author: { type: String },
    views: { type: String, default: '0' },
    category: { type: String },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
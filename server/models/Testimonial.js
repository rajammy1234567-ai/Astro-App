const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String },
    quote: { type: String, required: true },
    rating: { type: Number, default: 5 },
    thumbnail: { type: String },
    videoUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
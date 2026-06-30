const mongoose = require('mongoose');

const poojaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    icon: { type: String, default: 'flame-outline' },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pooja', poojaSchema);
const mongoose = require('mongoose');

const freeServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: 'gift-outline' },
    route: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FreeService', freeServiceSchema);
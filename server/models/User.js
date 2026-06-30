const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'User' },
    phone: { type: String, sparse: true, unique: true },
    email: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
    avatar: { type: String, default: 'https://i.pravatar.cc/150?img=47' },
    isVerified: { type: Boolean, default: false },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
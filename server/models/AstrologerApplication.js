const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    date: { type: String },
    day: { type: String },
    time: { type: String },
    googleMeetLink: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const panelCredentialsSchema = new mongoose.Schema(
  {
    loginId: { type: String },
    password: { type: String },
  },
  { _id: false }
);

const astrologerApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    specialty: { type: String, required: true },
    experience: { type: Number, default: 0 },
    bio: { type: String },
    languages: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'interview_scheduled', 'selected', 'rejected'],
      default: 'pending',
    },
    interview: interviewSchema,
    panelCredentials: panelCredentialsSchema,
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer' },
    adminNotes: { type: String },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);

astrologerApplicationSchema.index({ user: 1 });
astrologerApplicationSchema.index({ status: 1 });

module.exports = mongoose.model('AstrologerApplication', astrologerApplicationSchema);
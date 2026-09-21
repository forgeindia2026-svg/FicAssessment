const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['CREATED', 'LINK_GENERATED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'],
    default: 'LINK_GENERATED'
  },
  startedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  malpracticeDetected: {
    type: Boolean,
    default: false
  },
  malpracticeReason: {
    type: String,
    default: ''
  },
  terminationType: {
    type: String,
    enum: ['NORMAL_SUBMIT', 'MALPRACTICE_AUTO_TERMINATED', 'TIME_EXPIRED'],
    default: 'NORMAL_SUBMIT'
  },
  warningCount: {
    type: Number,
    default: 0
  },
  gazeAlertCount: {
    type: Number,
    default: 0
  },
  snapshots: [
    {
      capturedAt: { type: Date, default: Date.now },
      imageData: { type: String }
    }
  ],
  shuffledOptionsMap: {
    type: Map,
    of: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);

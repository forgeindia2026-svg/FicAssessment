const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  resume: {
    type: String,
    default: ''
  },
  resumeOriginalName: {
    type: String,
    default: ''
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['CREATED', 'REGISTERED', 'LINK_GENERATED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'],
    default: 'CREATED'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema);

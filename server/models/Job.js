const mongoose = require('mongoose');
const crypto = require('crypto');

const JobSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  publicToken: {
    type: String,
    unique: true,
    sparse: true
  },
  jobToken: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to ensure every job has unique secure publicToken & jobToken
JobSchema.pre('save', function (next) {
  if (!this.publicToken) {
    this.publicToken = crypto.randomBytes(16).toString('hex');
  }
  if (!this.jobToken) {
    this.jobToken = this.publicToken;
  }
  next();
});

module.exports = mongoose.model('Job', JobSchema);

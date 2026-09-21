const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  selectedAnswer: {
    type: String,
    enum: ['A', 'B', 'C', 'D', ''],
    default: ''
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  marks: {
    type: Number,
    default: 0
  }
});

// Index to quickly update/find an answer for an assessment + question
AnswerSchema.index({ assessmentId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('Answer', AnswerSchema);

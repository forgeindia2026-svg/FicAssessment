const mongoose = require('mongoose');

const AssessmentQuestionSchema = new mongoose.Schema({
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
  order: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('AssessmentQuestion', AssessmentQuestionSchema);

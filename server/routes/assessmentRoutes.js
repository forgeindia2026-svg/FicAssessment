const express = require('express');
const router = express.Router();
const {
  getAssessmentByToken,
  startAssessment,
  saveAnswer,
  submitAssessment,
  saveSnapshot,
  logWarning
} = require('../controllers/assessmentController');

router.get('/:token', getAssessmentByToken);
router.post('/:token/start', startAssessment);
router.post('/:token/answer', saveAnswer);
router.post('/:token/submit', submitAssessment);
router.post('/:token/snapshot', saveSnapshot);
router.post('/:token/warning', logWarning);

module.exports = router;

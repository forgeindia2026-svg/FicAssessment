const express = require('express');
const router = express.Router();
const {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate
} = require('../controllers/candidateController');
const { generateAssessmentLink } = require('../controllers/assessmentController');
const { protectAdmin } = require('../middleware/authMiddleware');
const uploadResume = require('../middleware/uploadMiddleware');

router.use(protectAdmin);

router.post('/:id/generate-assessment', generateAssessmentLink);

router.route('/')
  .get(getCandidates)
  .post(uploadResume.single('resume'), createCandidate);

router.route('/:id')
  .get(getCandidateById)
  .put(uploadResume.single('resume'), updateCandidate)
  .delete(deleteCandidate);

module.exports = router;

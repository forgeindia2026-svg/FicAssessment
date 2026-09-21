const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const { 
  getJobs, 
  getJobById, 
  createJob, 
  updateJob, 
  deleteJob 
} = require('../controllers/jobController');
const { getQuestions } = require('../controllers/questionController');

router.use(protectAdmin);

router.get('/', getJobs);
router.post('/', createJob);
router.get('/:id', getJobById);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

// GET /api/jobs/:jobId/questions
router.get('/:jobId/questions', (req, res, next) => {
  req.query.jobId = req.params.jobId;
  return getQuestions(req, res, next);
});

module.exports = router;

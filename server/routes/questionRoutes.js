const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions
} = require('../controllers/questionController');
const { generateAIQuestions } = require('../controllers/aiGeneratorController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.use(protectAdmin);

router.post('/bulk', bulkImportQuestions);
router.post('/ai-generate', generateAIQuestions);

router.route('/')
  .get(getQuestions)
  .post(createQuestion);

router.route('/:id')
  .get(getQuestionById)
  .put(updateQuestion)
  .delete(deleteQuestion);

module.exports = router;

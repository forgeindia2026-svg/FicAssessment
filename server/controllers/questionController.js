const Question = require('../models/Question');
const Job = require('../models/Job');
const { parseBulkQuestions } = require('../utils/bulkQuestionParser');

// Helper to remove duplicate questions in DB
const deduplicateQuestions = async () => {
  try {
    const questions = await Question.find().sort({ createdAt: 1 });
    const seen = new Set();
    const duplicatesToDelete = [];

    for (const q of questions) {
      const key = `${q.jobId ? q.jobId.toString() : ''}_${q.question.toLowerCase().trim()}`;
      if (seen.has(key)) {
        duplicatesToDelete.push(q._id);
      } else {
        seen.add(key);
      }
    }

    if (duplicatesToDelete.length > 0) {
      await Question.deleteMany({ _id: { $in: duplicatesToDelete } });
      console.log(`Cleaned up ${duplicatesToDelete.length} duplicate questions from database.`);
    }
  } catch (err) {
    console.error('Error deduplicating questions:', err);
  }
};

// GET /api/questions or GET /api/jobs/:jobId/questions
const getQuestions = async (req, res) => {
  // Automatically clean up any existing duplicates first
  await deduplicateQuestions();

  const jobId = req.params.jobId || req.query.jobId;
  const filter = jobId ? { jobId } : {};

  const questions = await Question.find(filter)
    .populate('jobId', 'name')
    .sort({ createdAt: -1 });

  res.json(questions);
};

// GET /api/questions/:id
const getQuestionById = async (req, res) => {
  const question = await Question.findById(req.params.id).populate('jobId', 'name');
  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }
  res.json(question);
};

// POST /api/questions
const createQuestion = async (req, res) => {
  const { jobId, question, optionA, optionB, optionC, optionD, correctAnswer, difficulty, explanation } = req.body;

  if (!jobId || !question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
    return res.status(400).json({ message: 'All fields (jobId, question, optionA, optionB, optionC, optionD, correctAnswer) are required' });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  const upperAns = correctAnswer.toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(upperAns)) {
    return res.status(400).json({ message: 'Correct answer must be A, B, C, or D' });
  }

  // Check for duplicate question statement for this job position
  const normQ = question.trim().toLowerCase();
  const existing = await Question.findOne({ jobId, question: new RegExp(`^${normQ}$`, 'i') });
  if (existing) {
    return res.status(400).json({ message: 'A question with this exact text already exists for this job position.' });
  }

  const validDiff = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';

  const newQuestion = await Question.create({
    jobId,
    question: question.trim(),
    optionA: optionA.trim(),
    optionB: optionB.trim(),
    optionC: optionC.trim(),
    optionD: optionD.trim(),
    correctAnswer: upperAns,
    difficulty: validDiff,
    explanation: explanation ? explanation.trim() : ''
  });

  res.status(201).json(newQuestion);
};

// PUT /api/questions/:id
const updateQuestion = async (req, res) => {
  const { question, optionA, optionB, optionC, optionD, correctAnswer, difficulty, explanation, jobId } = req.body;

  const q = await Question.findById(req.params.id);
  if (!q) {
    return res.status(404).json({ message: 'Question not found' });
  }

  if (jobId) {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    q.jobId = jobId;
  }

  if (question) q.question = question.trim();
  if (optionA) q.optionA = optionA.trim();
  if (optionB) q.optionB = optionB.trim();
  if (optionC) q.optionC = optionC.trim();
  if (optionD) q.optionD = optionD.trim();
  if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) q.difficulty = difficulty;
  if (explanation !== undefined) q.explanation = explanation.trim();
  if (correctAnswer) {
    const upperAns = correctAnswer.toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(upperAns)) {
      return res.status(400).json({ message: 'Correct answer must be A, B, C, or D' });
    }
    q.correctAnswer = upperAns;
  }

  await q.save();
  res.json(q);
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }

  await Question.findByIdAndDelete(req.params.id);
  res.json({ message: 'Question deleted successfully' });
};

// POST /api/questions/bulk
const bulkImportQuestions = async (req, res) => {
  const { jobId, rawText, previewOnly } = req.body;

  if (!jobId) {
    return res.status(400).json({ message: 'Target Job is required' });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Selected job position not found' });
  }

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ message: 'Bulk raw text is empty' });
  }

  const parsedItems = parseBulkQuestions(rawText);

  const totalCount = parsedItems.length;
  const validItems = parsedItems.filter(item => item.isValid);
  const invalidItems = parsedItems.filter(item => !item.isValid);

  if (totalCount === 0) {
    return res.status(400).json({ message: 'No questions could be parsed from the input format.' });
  }

  // If preview mode, return preview breakdown
  if (previewOnly) {
    return res.json({
      totalCount,
      validCount: validItems.length,
      invalidCount: invalidItems.length,
      parsedItems
    });
  }

  if (validItems.length === 0) {
    return res.status(400).json({
      message: 'No valid questions found to import. Please review validation errors.',
      totalCount,
      validCount: 0,
      invalidCount: invalidItems.length,
      parsedItems
    });
  }

  // Deduplicate against existing questions in DB & within import batch
  const existingQuestions = await Question.find({ jobId });
  const existingSet = new Set(existingQuestions.map(q => q.question.toLowerCase().trim()));

  const uniqueDocsToInsert = [];
  let duplicateCount = 0;

  for (const item of validItems) {
    const normQ = item.question.toLowerCase().trim();
    if (!existingSet.has(normQ)) {
      existingSet.add(normQ);
      uniqueDocsToInsert.push({
        jobId,
        question: item.question,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctAnswer: item.correctAnswer,
        difficulty: item.difficulty || 'Medium',
        explanation: item.explanation || ''
      });
    } else {
      duplicateCount += 1;
    }
  }

  if (uniqueDocsToInsert.length === 0) {
    return res.status(400).json({
      message: 'All questions in this import batch already exist in the Question Bank for this job position.',
      totalCount,
      validCount: validItems.length,
      duplicateCount
    });
  }

  const inserted = await Question.insertMany(uniqueDocsToInsert);

  res.status(201).json({
    message: `Successfully imported ${inserted.length} unique questions for ${job.name}.${duplicateCount > 0 ? ` (${duplicateCount} duplicate questions skipped)` : ''}`,
    importedCount: inserted.length,
    duplicateCount,
    totalParsed: totalCount,
    invalidCount: invalidItems.length,
    invalidItems
  });
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  deduplicateQuestions
};

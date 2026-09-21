const Assessment = require('../models/Assessment');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Question = require('../models/Question');
const AssessmentQuestion = require('../models/AssessmentQuestion');
const Answer = require('../models/Answer');
const { generateAssessmentToken } = require('../utils/tokenGenerator');

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to sync AssessmentQuestion collection strictly with active job Questions
async function syncAssessmentQuestions(assessment) {
  if (!assessment || !assessment.jobId) return [];

  const jId = assessment.jobId._id || assessment.jobId;
  const activeJobQuestions = await Question.find({ jobId: jId });
  const activeQuestionIds = new Set(activeJobQuestions.map(q => q._id.toString()));

  const existingAQ = await AssessmentQuestion.find({ assessmentId: assessment._id }).populate('questionId');
  
  // Filter out invalid/deleted/duplicate question references
  const seenQIds = new Set();
  const validAQ = [];
  
  for (const aq of existingAQ) {
    if (aq.questionId && activeQuestionIds.has(aq.questionId._id.toString())) {
      const qStr = aq.questionId._id.toString();
      if (!seenQIds.has(qStr)) {
        seenQIds.add(qStr);
        validAQ.push(aq);
      }
    }
  }

  // If question count mismatch or corrupted entries, resync AssessmentQuestion to match active job questions
  if (validAQ.length !== activeJobQuestions.length || validAQ.length === 0) {
    await AssessmentQuestion.deleteMany({ assessmentId: assessment._id });
    
    const easyQ = shuffleArray(activeJobQuestions.filter(q => q.difficulty === 'Easy'));
    const mediumQ = shuffleArray(activeJobQuestions.filter(q => q.difficulty === 'Medium'));
    const hardQ = shuffleArray(activeJobQuestions.filter(q => q.difficulty === 'Hard'));

    let balanced = [];
    if (easyQ.length > 0 || mediumQ.length > 0 || hardQ.length > 0) {
      balanced = [...easyQ, ...mediumQ, ...hardQ];
    } else {
      balanced = activeJobQuestions;
    }

    const shuffled = shuffleArray(balanced);
    const aqDocs = shuffled.map((q, idx) => ({
      assessmentId: assessment._id,
      questionId: q._id,
      order: idx + 1
    }));

    if (aqDocs.length > 0) {
      await AssessmentQuestion.insertMany(aqDocs);
    }

    assessment.totalQuestions = activeJobQuestions.length;
    await assessment.save();

    return await AssessmentQuestion.find({ assessmentId: assessment._id }).sort({ order: 1 }).populate('questionId');
  }

  if (assessment.totalQuestions !== validAQ.length) {
    assessment.totalQuestions = validAQ.length;
    await assessment.save();
  }

  return validAQ.sort((a, b) => a.order - b.order);
}

// POST /api/candidates/:id/generate-assessment
const generateAssessmentLink = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const job = await Job.findById(candidate.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Assigned job not found' });
  }

  const questionCount = await Question.countDocuments({ jobId: job._id });
  if (questionCount === 0) {
    return res.status(400).json({
      message: `Cannot generate assessment link. No questions exist for job "${job.name}". Please add questions first.`
    });
  }

  // Check if active assessment already exists for candidate
  let assessment = await Assessment.findOne({ candidateId: candidate._id });

  if (!assessment || assessment.status === 'COMPLETED' || assessment.status === 'EXPIRED') {
    const token = generateAssessmentToken();
    assessment = await Assessment.create({
      candidateId: candidate._id,
      jobId: job._id,
      token,
      status: 'LINK_GENERATED',
      totalQuestions: questionCount
    });
  } else {
    assessment.totalQuestions = questionCount;
    await assessment.save();
  }

  // Sync questions
  await syncAssessmentQuestions(assessment);

  const fullUrl = `${req.protocol}://${req.get('host')}/assessment/${assessment.token}`;

  res.json({
    message: 'Assessment link generated successfully',
    token: assessment.token,
    assessmentUrl: fullUrl,
    totalQuestions: questionCount,
    candidate: { id: candidate._id, name: candidate.name, email: candidate.email }
  });
};

// GET /api/assessment/:token
const getAssessmentByToken = async (req, res) => {
  const { token } = req.params;

  const assessment = await Assessment.findOne({ token })
    .populate('candidateId', 'name email phone notes status')
    .populate('jobId', 'name description');

  if (!assessment) {
    return res.status(404).json({ message: 'Invalid or expired assessment link' });
  }

  const orderedAQ = await syncAssessmentQuestions(assessment);
  const questionCount = orderedAQ.length;

  // Count answered questions if test was in progress
  const answeredCount = await Answer.countDocuments({
    assessmentId: assessment._id,
    selectedAnswer: { $ne: '' }
  });

  res.json({
    token: assessment.token,
    status: assessment.status,
    candidate: {
      id: assessment.candidateId._id,
      name: assessment.candidateId.name,
      email: assessment.candidateId.email
    },
    job: {
      id: assessment.jobId._id,
      name: assessment.jobId.name,
      description: assessment.jobId.description
    },
    durationMinutes: 30,
    totalQuestions: questionCount,
    answeredCount,
    startedAt: assessment.startedAt,
    expiresAt: assessment.expiresAt,
    submittedAt: assessment.submittedAt,
    score: assessment.score,
    malpracticeDetected: assessment.malpracticeDetected || false,
    malpracticeReason: assessment.malpracticeReason || '',
    terminationType: assessment.terminationType || 'NORMAL_SUBMIT'
  });
};

// POST /api/assessment/:token/start
const startAssessment = async (req, res) => {
  const { token } = req.params;

  const assessment = await Assessment.findOne({ token })
    .populate('candidateId', 'name email')
    .populate('jobId', 'name');

  if (!assessment) {
    return res.status(404).json({ message: 'Assessment session not found' });
  }

  if (assessment.status === 'COMPLETED') {
    return res.status(400).json({ message: 'This assessment has already been completed.', status: 'COMPLETED' });
  }

  if (assessment.status === 'EXPIRED') {
    return res.status(400).json({ message: 'This assessment duration has expired.', status: 'EXPIRED' });
  }

  // Check if test was already started
  if (!assessment.startedAt || assessment.status === 'LINK_GENERATED' || assessment.status === 'NOT_STARTED') {
    const now = new Date();
    const durationMs = 30 * 60 * 1000; // 30 minutes
    const expiresAt = new Date(now.getTime() + durationMs);

    assessment.startedAt = now;
    assessment.expiresAt = expiresAt;
    assessment.status = 'IN_PROGRESS';
    await assessment.save();

    await Candidate.findByIdAndUpdate(assessment.candidateId._id, { status: 'IN_PROGRESS' });
  } else {
    // If started but expired on current server check
    if (new Date() >= new Date(assessment.expiresAt)) {
      assessment.status = 'EXPIRED';
      await assessment.save();
      await Candidate.findByIdAndUpdate(assessment.candidateId._id, { status: 'EXPIRED' });
      return res.status(400).json({ message: 'Assessment timer has expired', status: 'EXPIRED' });
    }
  }

  // Sync and retrieve AssessmentQuestions
  const orderedAQ = await syncAssessmentQuestions(assessment);

  // Format questions for client (omit correctAnswer for security)
  const clientQuestions = orderedAQ
    .filter(aq => aq.questionId)
    .map((aq) => {
      const q = aq.questionId;
      return {
        id: q._id,
        order: aq.order,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD
      };
    });

  // Get saved answers
  const savedAnswers = await Answer.find({ assessmentId: assessment._id });
  const answersMap = {};
  savedAnswers.forEach(ans => {
    answersMap[ans.questionId.toString()] = ans.selectedAnswer;
  });

  res.json({
    assessmentId: assessment._id,
    token: assessment.token,
    candidateName: assessment.candidateId.name,
    jobName: assessment.jobId.name,
    status: assessment.status,
    startedAt: assessment.startedAt,
    expiresAt: assessment.expiresAt,
    totalQuestions: clientQuestions.length,
    questions: clientQuestions,
    answers: answersMap
  });
};

// POST /api/assessment/:token/answer
const saveAnswer = async (req, res) => {
  const { token } = req.params;
  const { questionId, selectedAnswer } = req.body;

  const assessment = await Assessment.findOne({ token });
  if (!assessment) {
    return res.status(404).json({ message: 'Assessment not found' });
  }

  if (assessment.status === 'COMPLETED') {
    return res.status(400).json({ message: 'Assessment already completed' });
  }

  // Server time check
  if (assessment.expiresAt && new Date() >= new Date(assessment.expiresAt)) {
    assessment.status = 'EXPIRED';
    await assessment.save();
    return res.status(400).json({ message: 'Assessment time expired', status: 'EXPIRED' });
  }

  if (!questionId) {
    return res.status(400).json({ message: 'questionId is required' });
  }

  const validAnswer = ['A', 'B', 'C', 'D', ''].includes(selectedAnswer) ? selectedAnswer : '';

  await Answer.findOneAndUpdate(
    { assessmentId: assessment._id, questionId },
    { selectedAnswer: validAnswer },
    { upsert: true, new: true }
  );

  res.json({ message: 'Answer saved', questionId, selectedAnswer: validAnswer });
};

// POST /api/assessment/:token/submit
const submitAssessment = async (req, res) => {
  const { token } = req.params;
  const { 
    answers: clientAnswersPayload,
    malpracticeDetected = false,
    malpracticeReason = '',
    terminationType = 'NORMAL_SUBMIT'
  } = req.body;

  const assessment = await Assessment.findOne({ token })
    .populate('candidateId', 'name email')
    .populate('jobId', 'name');

  if (!assessment) {
    return res.status(404).json({ message: 'Assessment not found' });
  }

  if (assessment.status === 'COMPLETED') {
    return res.status(400).json({
      message: 'Assessment has already been submitted and evaluated.',
      status: 'COMPLETED',
      malpracticeDetected: assessment.malpracticeDetected,
      malpracticeReason: assessment.malpracticeReason
    });
  }

  // Merge client answers payload into DB if provided
  if (clientAnswersPayload && typeof clientAnswersPayload === 'object') {
    for (const [qId, selAns] of Object.entries(clientAnswersPayload)) {
      const validAns = ['A', 'B', 'C', 'D', ''].includes(selAns) ? selAns : '';
      await Answer.findOneAndUpdate(
        { assessmentId: assessment._id, questionId: qId },
        { selectedAnswer: validAns },
        { upsert: true }
      );
    }
  }

  // Sync and Evaluate assessment
  const orderedAQ = await syncAssessmentQuestions(assessment);
  const allUserAnswers = await Answer.find({ assessmentId: assessment._id });

  const answerMap = {};
  allUserAnswers.forEach(ans => {
    answerMap[ans.questionId.toString()] = ans;
  });

  let score = 0;
  const totalQuestions = orderedAQ.length;

  for (const aq of orderedAQ) {
    const question = aq.questionId;
    if (!question) continue;

    const existingAnswerDoc = answerMap[question._id.toString()];
    const selectedAnswer = existingAnswerDoc ? existingAnswerDoc.selectedAnswer : '';
    const isCorrect = selectedAnswer === question.correctAnswer;

    if (isCorrect) score += 1;
  }

  assessment.score = score;
  assessment.totalQuestions = totalQuestions;
  assessment.status = 'COMPLETED';
  assessment.submittedAt = new Date();
  assessment.malpracticeDetected = Boolean(malpracticeDetected);
  assessment.malpracticeReason = malpracticeReason || (malpracticeDetected ? 'Proctoring Violation' : '');
  assessment.terminationType = terminationType;

  await assessment.save();

  // Update candidate status
  const candStatus = malpracticeDetected ? 'MALPRACTICE_TERMINATED' : 'TEST_COMPLETED';
  await Candidate.findByIdAndUpdate(assessment.candidateId._id, {
    status: candStatus,
    score,
    totalQuestions,
    malpracticeDetected: Boolean(malpracticeDetected),
    malpracticeReason: malpracticeReason || ''
  });

  res.json({
    message: 'Assessment submitted successfully',
    status: 'COMPLETED',
    score,
    totalQuestions,
    malpracticeDetected: Boolean(malpracticeDetected),
    malpracticeReason: assessment.malpracticeReason
  });
};

// POST /api/assessment/:token/snapshot
const saveSnapshot = async (req, res) => {
  const { token } = req.params;
  const { image } = req.body;

  const assessment = await Assessment.findOne({ token });
  if (!assessment) {
    return res.status(404).json({ message: 'Assessment not found' });
  }

  if (image) {
    assessment.snapshots = assessment.snapshots || [];
    assessment.snapshots.push({
      image,
      timestamp: new Date()
    });
    await assessment.save();
  }

  res.json({ message: 'Snapshot logged successfully' });
};

// POST /api/assessment/:token/warning
const logWarning = async (req, res) => {
  const { token } = req.params;
  const { reason, malpracticeDetected, malpracticeReason, terminationType } = req.body;

  const assessment = await Assessment.findOne({ token });
  if (!assessment) {
    return res.status(404).json({ message: 'Assessment not found' });
  }

  assessment.warningsCount = (assessment.warningsCount || 0) + 1;
  if (malpracticeDetected) {
    assessment.malpracticeDetected = true;
    assessment.malpracticeReason = malpracticeReason || reason || 'Proctoring Violation';
    assessment.status = 'COMPLETED';
    assessment.terminationType = terminationType || 'MALPRACTICE_TERMINATED';
    assessment.submittedAt = new Date();
  }

  await assessment.save();

  if (malpracticeDetected) {
    await Candidate.findByIdAndUpdate(assessment.candidateId, {
      status: 'MALPRACTICE_TERMINATED',
      malpracticeDetected: true,
      malpracticeReason: assessment.malpracticeReason
    });
  }

  res.json({
    message: 'Warning logged',
    warningsCount: assessment.warningsCount,
    malpracticeDetected: assessment.malpracticeDetected
  });
};

const syncAllAssessmentQuestions = async () => {
  try {
    const assessments = await Assessment.find({});
    for (const a of assessments) {
      await syncAssessmentQuestions(a);
    }
    console.log(`Synced questions for ${assessments.length} candidate assessments.`);
  } catch (err) {
    console.error('Error syncing all assessment questions:', err);
  }
};

module.exports = {
  generateAssessmentLink,
  getAssessmentByToken,
  startAssessment,
  saveAnswer,
  submitAssessment,
  saveSnapshot,
  logWarning,
  syncAllAssessmentQuestions
};

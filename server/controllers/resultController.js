const Assessment = require('../models/Assessment');
const AssessmentQuestion = require('../models/AssessmentQuestion');
const Answer = require('../models/Answer');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');

// GET /api/results
const getResults = async (req, res) => {
  const assessments = await Assessment.find()
    .populate('candidateId', 'name email phone')
    .populate('jobId', 'name')
    .sort({ createdAt: -1 });

  const Question = require('../models/Question');

  const results = await Promise.all(
    assessments.map(async (ass) => {
      let total = ass.totalQuestions || 0;
      if (ass.jobId) {
        const actualCount = await Question.countDocuments({ jobId: ass.jobId._id });
        if (actualCount > 0) {
          total = actualCount;
        }
      }

      const rawScore = ass.score || 0;
      const score = Math.min(rawScore, total);
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

      let timeTakenSeconds = 0;
      if (ass.startedAt && ass.submittedAt) {
        timeTakenSeconds = Math.max(0, Math.round((new Date(ass.submittedAt).getTime() - new Date(ass.startedAt).getTime()) / 1000));
      }

      return {
        _id: ass._id,
        token: ass.token,
        candidate: ass.candidateId ? {
          id: ass.candidateId._id,
          name: ass.candidateId.name,
          email: ass.candidateId.email
        } : { name: 'Unknown Candidate', email: '' },
        job: ass.jobId ? {
          id: ass.jobId._id,
          name: ass.jobId.name
        } : { name: 'Unknown Job' },
        score,
        totalQuestions: total,
        percentage,
        status: ass.status,
        startedAt: ass.startedAt,
        submittedAt: ass.submittedAt,
        timeTakenSeconds,
        malpracticeDetected: ass.malpracticeDetected || false,
        malpracticeReason: ass.malpracticeReason || '',
        terminationType: ass.terminationType || 'NORMAL_SUBMIT',
        createdAt: ass.createdAt
      };
    })
  );

  res.json(results);
};

// GET /api/results/:id
const getResultById = async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('candidateId', 'name email phone resume resumeOriginalName notes')
    .populate('jobId', 'name description');

  if (!assessment) {
    return res.status(404).json({ message: 'Assessment result not found' });
  }

  // Retrieve ordered questions
  const orderedAQ = await AssessmentQuestion.find({ assessmentId: assessment._id })
    .sort({ order: 1 })
    .populate('questionId');

  // Retrieve answers
  const userAnswers = await Answer.find({ assessmentId: assessment._id });
  const answerMap = {};
  userAnswers.forEach(ans => {
    answerMap[ans.questionId.toString()] = ans;
  });

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const seenQuestions = new Set();
  const questionBreakdown = [];

  for (const aq of orderedAQ) {
    const q = aq.questionId;
    if (!q) continue;

    const qKey = q.question.toLowerCase().trim();
    if (seenQuestions.has(qKey)) continue; // Skip duplicate question text in breakdown
    seenQuestions.add(qKey);

    const ansDoc = answerMap[q._id.toString()];
    const selectedAnswer = ansDoc ? ansDoc.selectedAnswer : '';
    const isCorrect = selectedAnswer && selectedAnswer === q.correctAnswer;

    if (!selectedAnswer) {
      unansweredCount += 1;
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      incorrectCount += 1;
    }

    questionBreakdown.push({
      order: questionBreakdown.length + 1,
      questionId: q._id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty || 'Medium',
      explanation: q.explanation || '',
      selectedAnswer: selectedAnswer || 'Unanswered',
      isCorrect: Boolean(isCorrect),
      isUnanswered: !selectedAnswer
    });
  }

  const Question = require('../models/Question');
  let actualJobCount = 0;
  if (assessment.jobId) {
    actualJobCount = await Question.countDocuments({ jobId: assessment.jobId._id });
  }

  const totalQuestions = actualJobCount > 0 ? actualJobCount : (assessment.totalQuestions || questionBreakdown.length);
  const score = Math.min(assessment.score || correctCount, totalQuestions);
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  let timeTakenSeconds = 0;
  if (assessment.startedAt && assessment.submittedAt) {
    timeTakenSeconds = Math.max(0, Math.round((new Date(assessment.submittedAt).getTime() - new Date(assessment.startedAt).getTime()) / 1000));
  }

  res.json({
    _id: assessment._id,
    token: assessment.token,
    candidate: assessment.candidateId,
    job: assessment.jobId,
    score,
    totalQuestions,
    correctCount,
    incorrectCount,
    unansweredCount,
    percentage,
    status: assessment.status,
    startedAt: assessment.startedAt,
    submittedAt: assessment.submittedAt,
    timeTakenSeconds,
    malpracticeDetected: assessment.malpracticeDetected || false,
    malpracticeReason: assessment.malpracticeReason || '',
    terminationType: assessment.terminationType || 'NORMAL_SUBMIT',
    warningCount: assessment.warningCount || 0,
    gazeAlertCount: assessment.gazeAlertCount || 0,
    snapshots: assessment.snapshots || [],
    questionBreakdown
  });
};

module.exports = {
  getResults,
  getResultById
};

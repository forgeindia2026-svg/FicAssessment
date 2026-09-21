const mongoose = require('mongoose');
const Job = require('../models/Job');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');
const Assessment = require('../models/Assessment');
const { generateAssessmentToken } = require('../utils/tokenGenerator');

// GET /api/public/jobs/:jobToken
const getJobDetailsForApply = async (req, res) => {
  const { jobToken } = req.params;

  const job = await Job.findOne({
    $or: [
      { publicToken: jobToken },
      { jobToken: jobToken },
      { _id: mongoose.Types.ObjectId.isValid(jobToken) ? jobToken : null }
    ]
  });

  if (!job) {
    return res.status(404).json({ message: 'Job link is invalid or no longer active.' });
  }

  const questionCount = await Question.countDocuments({ jobId: job._id });

  res.json({
    publicToken: job.publicToken || job.jobToken,
    jobToken: job.publicToken || job.jobToken,
    jobId: job._id,
    name: job.name,
    description: job.description,
    durationMinutes: 30,
    totalQuestions: questionCount
  });
};

// POST /api/public/jobs/:jobToken/register  OR  POST /api/public/apply/:jobToken
const applyAndStartAssessment = async (req, res) => {
  const { jobToken } = req.params;
  const { name, email, phone } = req.body;

  if (!name || !name.trim() || !email || !email.trim()) {
    return res.status(400).json({ message: 'Full Name and Email Address are required' });
  }

  const job = await Job.findOne({
    $or: [{ publicToken: jobToken }, { jobToken: jobToken }, { _id: mongoose.Types.ObjectId.isValid(jobToken) ? jobToken : null }],
    $or: [{ status: 'active' }, { status: 'ACTIVE' }, { status: { $exists: false } }]
  });

  if (!job) {
    return res.status(404).json({ message: 'Job position not found or link is inactive' });
  }

  const questionCount = await Question.countDocuments({ jobId: job._id });
  const cleanEmail = email.trim().toLowerCase();
  let candidate = await Candidate.findOne({ email: cleanEmail, jobId: job._id });

  if (candidate) {
    candidate.name = name.trim();
    if (phone) candidate.phone = phone.trim();
    await candidate.save();
  } else {
    candidate = await Candidate.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      jobId: job._id,
      status: 'REGISTERED'
    });
  }

  // Generate or reuse Assessment Token & Session Document
  let assessment = await Assessment.findOne({ candidateId: candidate._id });
  if (assessment && assessment.status !== 'COMPLETED') {
    assessment.totalQuestions = questionCount;
    await assessment.save();
  } else if (!assessment) {
    const assessmentToken = generateAssessmentToken();
    assessment = await Assessment.create({
      candidateId: candidate._id,
      jobId: job._id,
      token: assessmentToken,
      status: 'LINK_GENERATED',
      totalQuestions: questionCount
    });
  }

  // Real-Time SSE Broadcast & Email Notification
  try {
    const { broadcastNotification } = require('../utils/sseService');
    const { sendRegistrationEmail } = require('../utils/emailService');

    broadcastNotification({
      type: 'CANDIDATE_REGISTERED',
      data: {
        id: `cand-${candidate._id}`,
        title: `Candidate Registered: ${candidate.name}`,
        desc: `Assigned Track: ${job.name || 'General Track'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'SYSTEM',
        link: `/admin/candidates/${candidate._id}`
      }
    });

    sendRegistrationEmail({
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      jobName: job.name,
      applyToken: assessment.token
    });
  } catch (notifErr) {
    console.error('Notification dispatch error:', notifErr);
  }

  res.status(201).json({
    message: 'Candidate registered successfully',
    assessmentToken: assessment.token,
    candidateName: candidate.name,
    jobName: job.name,
    redirectUrl: `/assessment/${assessment.token}`
  });
};

module.exports = {
  getJobDetailsForApply,
  applyAndStartAssessment,
  registerCandidate: applyAndStartAssessment
};

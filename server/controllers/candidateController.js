const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Assessment = require('../models/Assessment');

// Helper to remove duplicate candidate registrations
const deduplicateCandidates = async () => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    const seenMap = new Map();
    const duplicatesToDelete = [];

    for (const cand of candidates) {
      const key = `${cand.jobId ? cand.jobId.toString() : ''}_${cand.email.toLowerCase().trim()}`;
      if (seenMap.has(key)) {
        const primaryCandId = seenMap.get(key);
        await Assessment.updateMany({ candidateId: cand._id }, { candidateId: primaryCandId });
        duplicatesToDelete.push(cand._id);
      } else {
        seenMap.set(key, cand._id);
      }
    }

    if (duplicatesToDelete.length > 0) {
      await Candidate.deleteMany({ _id: { $in: duplicatesToDelete } });
      console.log(`Cleaned up ${duplicatesToDelete.length} duplicate candidate records.`);
    }
  } catch (err) {
    console.error('Error deduplicating candidates:', err);
  }
};

// GET /api/candidates
const getCandidates = async (req, res) => {
  await deduplicateCandidates();

  const Question = require('../models/Question');

  const candidates = await Candidate.find()
    .populate('jobId', 'name description')
    .sort({ createdAt: -1 });

  // Attach latest assessment info if available
  const candidatesWithAssessment = await Promise.all(
    candidates.map(async (cand) => {
      const assessment = await Assessment.findOne({ candidateId: cand._id }).sort({ createdAt: -1 });
      
      let totalQuestions = assessment?.totalQuestions || 0;
      if (cand.jobId) {
        const actualCount = await Question.countDocuments({ jobId: cand.jobId._id });
        if (actualCount > 0) {
          totalQuestions = actualCount;
        }
      }

      const score = Math.min(assessment?.score || 0, totalQuestions);

      return {
        ...cand.toObject(),
        assessment: assessment ? {
          _id: assessment._id,
          token: assessment.token,
          status: assessment.status,
          score,
          totalQuestions
        } : null
      };
    })
  );

  res.json(candidatesWithAssessment);
};

// GET /api/candidates/:id
const getCandidateById = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('jobId', 'name description');
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const assessment = await Assessment.findOne({ candidateId: candidate._id }).sort({ createdAt: -1 });

  res.json({
    ...candidate.toObject(),
    assessment: assessment ? {
      _id: assessment._id,
      token: assessment.token,
      status: assessment.status,
      score: assessment.score,
      totalQuestions: assessment.totalQuestions,
      startedAt: assessment.startedAt,
      expiresAt: assessment.expiresAt,
      submittedAt: assessment.submittedAt
    } : null
  });
};

// POST /api/candidates
const createCandidate = async (req, res) => {
  const { name, email, phone, jobId, notes } = req.body;

  if (!name || !email || !jobId) {
    return res.status(400).json({ message: 'Name, Email, and Assigned Job are required' });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Assigned job position not found' });
  }

  let resumePath = '';
  let resumeOriginalName = '';

  if (req.file) {
    resumePath = req.file.filename;
    resumeOriginalName = req.file.originalname;
  }

  const cleanEmail = email.trim().toLowerCase();
  let candidate = await Candidate.findOne({ email: cleanEmail, jobId });

  if (candidate) {
    candidate.name = name.trim();
    if (phone !== undefined) candidate.phone = phone.trim();
    if (notes !== undefined) candidate.notes = notes.trim();
    if (resumePath) {
      candidate.resume = resumePath;
      candidate.resumeOriginalName = resumeOriginalName;
    }
    await candidate.save();
  } else {
    candidate = await Candidate.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      jobId,
      notes: notes ? notes.trim() : '',
      resume: resumePath,
      resumeOriginalName,
      status: 'CREATED'
    });
  }

  res.status(201).json(candidate);
};

// PUT /api/candidates/:id
const updateCandidate = async (req, res) => {
  const { name, email, phone, jobId, notes } = req.body;

  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  if (jobId && jobId !== candidate.jobId.toString()) {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    candidate.jobId = jobId;
  }

  if (name) candidate.name = name.trim();
  if (email) candidate.email = email.trim().toLowerCase();
  if (phone !== undefined) candidate.phone = phone.trim();
  if (notes !== undefined) candidate.notes = notes.trim();

  if (req.file) {
    candidate.resume = req.file.filename;
    candidate.resumeOriginalName = req.file.originalname;
  }

  await candidate.save();
  res.json(candidate);
};

// DELETE /api/candidates/:id
const deleteCandidate = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  // Delete associated assessments
  await Assessment.deleteMany({ candidateId: candidate._id });

  await Candidate.findByIdAndDelete(req.params.id);
  res.json({ message: 'Candidate and associated assessments deleted successfully' });
};

module.exports = {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  deduplicateCandidates
};

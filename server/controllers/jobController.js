const crypto = require('crypto');
const Job = require('../models/Job');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

// GET /api/jobs
const getJobs = async (req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 });

  const clientUrl = getClientUrl();

  const jobsWithStats = await Promise.all(
    jobs.map(async (job) => {
      // Ensure existing jobs get publicToken if missing
      if (!job.publicToken || !job.jobToken) {
        const tokenVal = crypto.randomBytes(16).toString('hex');
        job.publicToken = job.publicToken || tokenVal;
        job.jobToken = job.jobToken || job.publicToken;
        await job.save();
      }

      const questionCount = await Question.countDocuments({ jobId: job._id });
      const candidateCount = await Candidate.countDocuments({ jobId: job._id });

      const token = job.publicToken || job.jobToken;

      return {
        ...job.toObject(),
        publicToken: token,
        jobToken: token,
        questionCount,
        candidateCount,
        registrationUrl: `${clientUrl}/apply/${token}`
      };
    })
  );

  res.json(jobsWithStats);
};

// GET /api/jobs/:id
const getJobById = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job position not found' });
  }

  if (!job.publicToken || !job.jobToken) {
    const tokenVal = crypto.randomBytes(16).toString('hex');
    job.publicToken = job.publicToken || tokenVal;
    job.jobToken = job.jobToken || job.publicToken;
    await job.save();
  }

  const questionCount = await Question.countDocuments({ jobId: job._id });
  const candidateCount = await Candidate.countDocuments({ jobId: job._id });
  const clientUrl = getClientUrl();
  const token = job.publicToken || job.jobToken;

  res.json({
    ...job.toObject(),
    publicToken: token,
    jobToken: token,
    questionCount,
    candidateCount,
    registrationUrl: `${clientUrl}/apply/${token}`
  });
};

// POST /api/jobs
const createJob = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Job name is required' });
  }

  const existingJob = await Job.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
  if (existingJob) {
    return res.status(400).json({ message: 'A job position with this name already exists' });
  }

  const publicToken = crypto.randomBytes(16).toString('hex');

  const job = await Job.create({
    name: name.trim(),
    description: description ? description.trim() : '',
    publicToken,
    jobToken: publicToken,
    status: 'active'
  });

  const clientUrl = getClientUrl();

  res.status(201).json({
    ...job.toObject(),
    registrationUrl: `${clientUrl}/apply/${job.publicToken}`
  });
};

// PUT /api/jobs/:id
const updateJob = async (req, res) => {
  const { name, description, status } = req.body;

  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job position not found' });
  }

  if (name && name.trim()) {
    const existingJob = await Job.findOne({
      _id: { $ne: job._id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existingJob) {
      return res.status(400).json({ message: 'Another job position with this name already exists' });
    }
    job.name = name.trim();
  }

  if (description !== undefined) {
    job.description = description.trim();
  }

  if (status && ['active', 'inactive'].includes(status)) {
    job.status = status;
  }

  if (!job.publicToken) {
    job.publicToken = crypto.randomBytes(16).toString('hex');
    job.jobToken = job.publicToken;
  }

  await job.save();
  const clientUrl = getClientUrl();

  res.json({
    ...job.toObject(),
    registrationUrl: `${clientUrl}/apply/${job.publicToken}`
  });
};

// DELETE /api/jobs/:id
const deleteJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job position not found' });
  }

  const questionCount = await Question.countDocuments({ jobId: job._id });
  const candidateCount = await Candidate.countDocuments({ jobId: job._id });

  if (questionCount > 0 || candidateCount > 0) {
    return res.status(400).json({
      message: `Cannot delete job with associated ${questionCount} questions and ${candidateCount} candidates. Disable it instead.`
    });
  }

  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: 'Job position deleted successfully' });
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};

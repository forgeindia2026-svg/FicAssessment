const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedDefaultAdmin } = require('./controllers/authController');
const { deduplicateQuestions } = require('./controllers/questionController');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/assessment', require('./routes/assessmentRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

const { handleSSEConnection } = require('./utils/sseService');

// SSE Real-Time Notification Stream for Admin
app.get('/api/notifications/stream', handleSSEConnection);

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FIC Assessment Platform API is running' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const { deduplicateCandidates } = require('./controllers/candidateController');
const { syncAllAssessmentQuestions } = require('./controllers/assessmentController');

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Seed default admin account
  await seedDefaultAdmin();
  // Clean up duplicate questions
  await deduplicateQuestions();
  // Clean up duplicate candidate registrations
  await deduplicateCandidates();
  // Sync all assessment question counts with actual active job questions
  await syncAllAssessmentQuestions();
});

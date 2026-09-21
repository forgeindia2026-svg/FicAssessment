import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import JobsList from './pages/admin/JobsList';
import JobForm from './pages/admin/JobForm';
import QuestionsList from './pages/admin/QuestionsList';
import BulkQuestionImport from './pages/admin/BulkQuestionImport';
import CandidatesList from './pages/admin/CandidatesList';
import CandidateForm from './pages/admin/CandidateForm';
import CandidateDetails from './pages/admin/CandidateDetails';
import ResultsList from './pages/admin/ResultsList';
import ResultDetails from './pages/admin/ResultDetails';
import FiloNotifications from './pages/admin/FiloNotifications';

// Candidate Pages
import CandidateLanding from './pages/candidate/CandidateLanding';
import DemoTest from './pages/candidate/DemoTest';
import ActualAssessment from './pages/candidate/ActualAssessment';
import AssessmentCompleted from './pages/candidate/AssessmentCompleted';
import JobCandidateApply from './pages/candidate/JobCandidateApply';
import JobRoleAssessmentEntry from './pages/candidate/JobRoleAssessmentEntry';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Root Redirect to Admin Login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            <Route path="/admin/jobs" element={<JobsList />} />
            <Route path="/admin/jobs/new" element={<JobForm />} />
            <Route path="/admin/jobs/:id" element={<JobForm />} />

            <Route path="/admin/questions" element={<QuestionsList />} />
            <Route path="/admin/questions/bulk" element={<BulkQuestionImport />} />

            <Route path="/admin/candidates" element={<CandidatesList />} />
            <Route path="/admin/candidates/new" element={<CandidateForm />} />
            <Route path="/admin/candidates/:id" element={<CandidateDetails />} />

            <Route path="/admin/results" element={<ResultsList />} />
            <Route path="/admin/results/:id" element={<ResultDetails />} />

            <Route path="/admin/notifications" element={<FiloNotifications />} />
            <Route path="/admin/filo-push" element={<FiloNotifications />} />
          </Route>
        </Route>

        {/* Candidate Assessment Public Routes */}
        <Route path="/apply/:jobToken" element={<JobCandidateApply />} />
        <Route path="/test/job/:jobToken" element={<JobRoleAssessmentEntry />} />
        <Route path="/assessment/:token" element={<CandidateLanding />} />
        <Route path="/assessment/:token/demo" element={<DemoTest />} />
        <Route path="/assessment/:token/test" element={<ActualAssessment />} />
        <Route path="/assessment/:token/completed" element={<AssessmentCompleted />} />

        {/* 404 Catch All */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

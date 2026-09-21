import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import { ArrowLeft, UserPlus, Upload, Loader2, AlertCircle } from 'lucide-react';

const CandidateForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobId, setJobId] = useState('');
  const [notes, setNotes] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await API.get('/jobs');
        const activeJobs = (res.data || []).filter(j => j.status === 'active');
        setJobs(activeJobs);
        if (activeJobs.length > 0) {
          setJobId(activeJobs[0]._id);
        }
      } catch (err) {
        setError('Failed to fetch job positions');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !jobId) {
      setError('Name, Email, and Assigned Job are required');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('jobId', jobId);
    formData.append('notes', notes);
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    try {
      await API.post('/candidates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/admin/candidates');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#800000] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center space-x-4">
        <Link
          to="/admin/candidates"
          className="p-2 text-[#5a413d] hover:text-[#800000] bg-[#fff0f0] hover:bg-[#ffe1e1] border border-[#e2bfb9] rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#311213]">Create Candidate</h1>
          <p className="text-sm text-[#8e706c] font-medium">Add candidate information and assign dynamic job evaluation track</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-start space-x-3 text-rose-800 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-2">
              Candidate Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-4 py-3 text-sm text-[#311213] focus:outline-none focus:border-[#800000]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-4 py-3 text-sm text-[#311213] focus:outline-none focus:border-[#800000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-4 py-3 text-sm text-[#311213] focus:outline-none focus:border-[#800000]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-2">
              Assigned Job / Process *
            </label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-4 py-3 text-sm text-[#311213] font-semibold focus:outline-none focus:border-[#800000]"
            >
              {jobs.length === 0 && <option value="">No active job positions found. Create one first.</option>}
              {jobs.map(j => (
                <option key={j._id} value={j._id}>
                  {j.name} ({j.questionCount || 0} Questions available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-2">
              Upload Resume (PDF, DOC, DOCX, TXT)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setResumeFile(e.target.files[0] || null)}
                className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-4 py-3 text-sm text-[#5a413d] file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#fff0f0] file:text-[#800000] hover:file:bg-[#ffe1e1] cursor-pointer"
              />
            </div>
            {resumeFile && (
              <p className="text-xs text-[#800000] font-semibold mt-1.5 flex items-center space-x-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Selected: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-2">
              Internal Notes / Comments
            </label>
            <textarea
              rows={3}
              placeholder="Candidate background, interview stage, or recruiter notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-4 py-3 text-sm text-[#311213] focus:outline-none focus:border-[#800000] resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#ffe9e8]">
            <Link
              to="/admin/candidates"
              className="px-5 py-2.5 rounded-xl border border-[#e2bfb9] text-[#5a413d] hover:bg-[#fff0f0] text-sm font-semibold transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || jobs.length === 0}
              className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm text-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Candidate...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Candidate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateForm;

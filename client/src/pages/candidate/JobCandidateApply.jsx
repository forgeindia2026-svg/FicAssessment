import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../services/api';
import { 
  Briefcase, 
  User, 
  Mail, 
  Phone, 
  PlayCircle, 
  Loader2, 
  AlertCircle,
  Clock,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

const JobCandidateApply = () => {
  const { jobToken } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobInfo = async () => {
      try {
        const res = await axios.get(getApiUrl(`/public/jobs/${jobToken}`));
        setJob(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Job registration link is invalid or no longer active.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobInfo();
  }, [jobToken]);

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (job?.totalQuestions === 0) {
      setError(`No questions available for "${job?.name}". Please contact your administrator.`);
      return;
    }

    if (!name.trim()) {
      setError('Full Name is required');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid Email Address');
      return;
    }

    if (phone && phone.length !== 10) {
      setError('Phone Number must be exactly 10 digits');
      return;
    }

    setSubmitting(true);

    try {
      const res = await axios.post(getApiUrl(`/public/apply/${jobToken}`), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      });

      const assessmentToken = res.data.assessmentToken;
      navigate(`/assessment/${assessmentToken}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit candidate registration');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f7] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#800000] animate-spin" />
        <p className="text-sm font-semibold text-[#311213]">Loading job assessment portal...</p>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center p-4">
        <div className="bg-white border border-[#e2bfb9] rounded-md p-8 max-w-md w-full text-center space-y-4 shadow-lg">
          <img
            src="/logo.png"
            alt="Forge India Connect Logo"
            className="w-16 h-16 rounded-full mx-auto border border-[#e2bfb9] object-cover"
          />
          <h2 className="text-xl font-bold text-[#311213]">Assessment Link Unavailable</h2>
          <p className="text-sm text-[#8e706c]">{error}</p>
        </div>
      </div>
    );
  }

  const noQuestions = job?.totalQuestions === 0;

  return (
    <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center p-4 select-none font-sans text-[#311213]">
      <div className="w-full max-w-xl bg-white border border-[#e2bfb9] rounded-md shadow-lg overflow-hidden space-y-6">
        {/* Header Banner */}
        <div className="bg-[#800000] p-8 text-center text-white relative">
          <img
            src="/logo.png"
            alt="Forge India Connect Logo"
            className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-white/80 shadow-md object-cover"
          />
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">FORGE INDIA CONNECT</h1>
          <p className="text-rose-200 text-xs mt-1 font-semibold">Candidate Assessment Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
          {error && (
            <div className="bg-[#fff0f0] border border-[#e2bfb9] rounded-md p-4 flex items-start space-x-3 text-[#800000] text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#800000] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {noQuestions && (
            <div className="bg-amber-50 border border-amber-300 rounded-md p-4 flex items-start space-x-3 text-amber-900 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-900">No Assessment Questions Uploaded</p>
                <p className="text-amber-800 mt-0.5">
                  The administrator has not uploaded question MCQs for "{job?.name}" yet. Candidate registration is currently paused for this position.
                </p>
              </div>
            </div>
          )}

          {/* Assigned Position Box */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-5 rounded-md space-y-3">
            <span className="text-[11px] font-bold text-[#8e706c] uppercase tracking-wider block">Assigned Position Track</span>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-[#800000]" />
              <span className="text-xl font-extrabold text-[#311213]">{job?.name}</span>
            </div>

            {job?.description && (
              <p className="text-xs text-[#8e706c] leading-relaxed line-clamp-2">{job.description}</p>
            )}

            <div className="flex items-center space-x-6 text-xs text-[#5a413d] font-semibold pt-1">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Duration: {job?.durationMinutes || 30} Mins</span>
              </span>
              <span className="flex items-center space-x-1">
                <HelpCircle className="w-4 h-4 text-[#800000]" />
                <span className={noQuestions ? 'text-amber-700 font-bold' : ''}>
                  Questions: {job?.totalQuestions || 0} MCQs
                </span>
              </span>
            </div>
          </div>

          {/* Candidate Registration Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5a413d] uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8e706c] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={noQuestions}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md pl-10 pr-4 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000] disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a413d] uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8e706c] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={noQuestions}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md pl-10 pr-4 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000] disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-[#5a413d] uppercase tracking-wider">
                  Phone Number
                </label>
                <span className="text-[11px] text-[#8e706c] font-medium">{phone.length}/10 digits</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8e706c] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={handlePhoneChange}
                  disabled={noQuestions}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md pl-10 pr-4 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000] disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || noQuestions}
            className="w-full flex items-center justify-center space-x-2 bg-[#800000] hover:bg-[#570000] disabled:opacity-40 text-white font-bold py-3.5 px-4 rounded-md shadow transition-all text-sm cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Initializing Session...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>{noQuestions ? 'Questions Pending Upload' : 'Start Assessment'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobCandidateApply;

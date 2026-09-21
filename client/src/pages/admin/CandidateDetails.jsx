import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import Badge from '../../components/Badge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  FileText, 
  Link2, 
  Copy, 
  Check, 
  Award,
  Loader2,
  Calendar
} from 'lucide-react';

const CandidateDetails = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCandidateDetails = async () => {
    try {
      const res = await API.get(`/candidates/${id}`);
      setCandidate(res.data);
    } catch (err) {
      console.error('Error loading candidate details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateDetails();
  }, [id]);

  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      await API.post(`/candidates/${id}/generate-assessment`);
      setSuccessMsg('Assessment link generated successfully!');
      fetchCandidateDetails();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate assessment link');
    } finally {
      setGenerating(false);
    }
  };

  const token = candidate?.assessment?.token;
  const assessmentUrl = token ? `${window.location.origin}/assessment/${token}` : '';

  const handleCopyLink = () => {
    if (!assessmentUrl) return;
    navigator.clipboard.writeText(assessmentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#800000] animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center p-12 text-[#8e706c] font-medium">
        Candidate record not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/candidates"
            className="p-2 text-[#5a413d] hover:text-[#800000] bg-[#fff0f0] hover:bg-[#ffe1e1] border border-[#e2bfb9] rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#311213]">{candidate.name}</h1>
            <p className="text-sm text-[#8e706c] font-medium">Candidate Profile & Assessment Lifecycle</p>
          </div>
        </div>
        <Badge status={candidate.status} />
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-white border border-[#e2bfb9] rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-[#311213] border-b border-[#ffe9e8] pb-3 flex items-center space-x-2">
            <User className="w-5 h-5 text-[#800000]" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-[#fff8f7] p-4 rounded-xl border border-[#e2bfb9]">
              <span className="text-xs font-bold text-[#8e706c] uppercase block mb-1">Full Name</span>
              <span className="font-bold text-[#311213]">{candidate.name}</span>
            </div>

            <div className="bg-[#fff8f7] p-4 rounded-xl border border-[#e2bfb9]">
              <span className="text-xs font-bold text-[#8e706c] uppercase block mb-1">Email Address</span>
              <span className="font-medium text-[#311213] flex items-center space-x-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-[#8e706c] shrink-0" />
                <span className="truncate">{candidate.email}</span>
              </span>
            </div>

            <div className="bg-[#fff8f7] p-4 rounded-xl border border-[#e2bfb9]">
              <span className="text-xs font-bold text-[#8e706c] uppercase block mb-1">Phone Number</span>
              <span className="font-medium text-[#311213] flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-[#8e706c]" />
                <span>{candidate.phone || 'N/A'}</span>
              </span>
            </div>

            <div className="bg-[#fff8f7] p-4 rounded-xl border border-[#e2bfb9]">
              <span className="text-xs font-bold text-[#8e706c] uppercase block mb-1">Assigned Job</span>
              <span className="font-bold text-[#800000] flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{candidate.jobId?.name || 'Unassigned'}</span>
              </span>
            </div>
          </div>

          {/* Resume section */}
          <div className="bg-[#fff8f7] p-4 rounded-xl border border-[#e2bfb9] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-[#800000]" />
              <div>
                <span className="text-xs font-bold text-[#8e706c] uppercase block">Candidate Resume</span>
                <span className="text-sm font-semibold text-[#311213]">
                  {candidate.resumeOriginalName || (candidate.resume ? 'Uploaded Resume Document' : 'No Resume Uploaded')}
                </span>
              </div>
            </div>
            {candidate.resume && (
              <a
                href={`/uploads/${candidate.resume}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#fff0f0] hover:bg-[#ffe1e1] text-[#800000] border border-[#e2bfb9] text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                Open Resume
              </a>
            )}
          </div>

          {/* Internal Notes */}
          {candidate.notes && (
            <div className="bg-[#fff8f7] p-4 rounded-xl border border-[#e2bfb9]">
              <span className="text-xs font-bold text-[#8e706c] uppercase block mb-1">Internal Notes</span>
              <p className="text-sm text-[#311213] leading-relaxed">{candidate.notes}</p>
            </div>
          )}
        </div>

        {/* Assessment Link Card */}
        <div className="bg-white border border-[#e2bfb9] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-[#311213] border-b border-[#ffe9e8] pb-3 flex items-center space-x-2">
              <Link2 className="w-5 h-5 text-[#800000]" />
              <span>Assessment Link</span>
            </h2>

            <p className="text-xs text-[#8e706c] mt-4 leading-relaxed font-medium">
              Generate a unique candidate token URL to send manually via messaging or email.
            </p>

            {assessmentUrl ? (
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-bold text-[#8e706c] uppercase">Token URL</label>
                <div className="bg-[#fff8f7] border border-[#e2bfb9] p-3 rounded-xl text-xs font-mono text-[#800000] break-all font-semibold">
                  {assessmentUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span className="text-emerald-100 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Unique Link</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateLink}
                disabled={generating}
                className="w-full mt-6 flex items-center justify-center space-x-2 bg-[#800000] hover:bg-[#570000] disabled:opacity-50 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-sm transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Generate Assessment Link</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Result quick link if completed */}
          {candidate.assessment?.status === 'COMPLETED' && (
            <div className={`p-4 rounded-xl space-y-2 border ${
              candidate.assessment.malpracticeDetected 
                ? 'bg-rose-50 border-rose-300' 
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`text-xs font-bold uppercase flex items-center space-x-1 ${
                candidate.assessment.malpracticeDetected ? 'text-rose-900' : 'text-emerald-800'
              }`}>
                <Award className={`w-4 h-4 ${candidate.assessment.malpracticeDetected ? 'text-rose-700' : 'text-emerald-600'}`} />
                <span>{candidate.assessment.malpracticeDetected ? '🚨 Test Auto-Terminated (Malpractice)' : 'Test Completed'}</span>
              </span>
              <p className="text-xs text-[#311213] font-semibold">
                Score: <strong className="text-[#800000]">{candidate.assessment.score} / {candidate.assessment.totalQuestions}</strong>
              </p>
              {candidate.assessment.malpracticeDetected && (
                <p className="text-xs text-rose-800 font-bold bg-rose-100 p-2 rounded-lg border border-rose-200">
                  Reason: {candidate.assessment.malpracticeReason || 'Tab switch or window blur detected'}
                </p>
              )}
              <Link
                to={`/admin/results/${candidate.assessment._id}`}
                className={`block text-center text-xs font-bold hover:underline pt-1 ${
                  candidate.assessment.malpracticeDetected ? 'text-rose-900' : 'text-emerald-800'
                }`}
              >
                View Detailed Evaluation Report →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;

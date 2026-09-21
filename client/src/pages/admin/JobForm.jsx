import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import { ArrowLeft, Save, Loader2, AlertCircle, Copy, Check, Send } from 'lucide-react';

const JobForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [applyUrl, setApplyUrl] = useState('');

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      const fetchJob = async () => {
        try {
          const res = await API.get(`/jobs/${id}`);
          setName(res.data.name || '');
          setDescription(res.data.description || '');
          setStatus(res.data.status || 'active');
          if (res.data.jobToken) {
            setApplyUrl(`${window.location.origin}/apply/${res.data.jobToken}`);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load job position details');
        } finally {
          setLoading(false);
        }
      };
      fetchJob();
    }
  }, [id, isEdit]);

  const handleCopyApplyLink = () => {
    if (!applyUrl) return;
    navigator.clipboard.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Job name is required');
      return;
    }

    setSubmitting(true);

    try {
      if (isEdit) {
        await API.put(`/jobs/${id}`, { name, description, status });
      } else {
        await API.post('/jobs', { name, description });
      }
      navigate('/admin/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job position');
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
      {/* Back link & Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/admin/jobs"
          className="p-2 text-[#5a413d] hover:text-[#800000] bg-white border border-[#e2bfb9] rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#311213]">
            {isEdit ? 'Edit Job Position' : 'Create Job Position'}
          </h1>
          <p className="text-sm text-[#8e706c]">
            {isEdit ? 'Update position title, status, and public candidate job link' : 'Add a new dynamic job position track'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-[#e2bfb9] rounded-md p-8 shadow-sm space-y-6">
        {applyUrl && (
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-4 rounded-md space-y-2">
            <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider flex items-center space-x-1.5">
              <Send className="w-4 h-4 text-[#800000]" />
              <span>Reusable Public Job Link (/apply/:jobToken)</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={applyUrl}
                className="flex-1 bg-white border border-[#e2bfb9] rounded-md px-3 py-2 text-xs font-mono text-[#800000] font-semibold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyApplyLink}
                className="flex items-center space-x-1.5 bg-[#800000] hover:bg-[#570000] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-all shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[#fff0f0] border border-[#e2bfb9] rounded-md p-4 flex items-start space-x-3 text-[#800000] text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#800000] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#5a413d] uppercase tracking-wider mb-2">
              Job Title / Position Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Software Developer, HR Executive, QA Engineer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md px-4 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a413d] uppercase tracking-wider mb-2">
              Job Description & Candidate Instructions
            </label>
            <textarea
              rows={4}
              placeholder="Enter brief job overview or target skills required for this assessment position..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md px-4 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000] resize-none"
            />
          </div>

          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-[#5a413d] uppercase tracking-wider mb-2">
                Job Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md px-4 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000]"
              >
                <option value="active">Active (Registration & Assessments Enabled)</option>
                <option value="inactive">Inactive (Disabled)</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#ffe9e8]">
            <Link
              to="/admin/jobs"
              className="px-5 py-2.5 rounded-md border border-[#e2bfb9] text-[#5a413d] hover:bg-[#fff0f0] text-sm font-medium transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white font-semibold px-6 py-2.5 rounded-md shadow-sm text-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Job' : 'Create Job'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;

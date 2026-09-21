import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import Badge from '../../components/Badge';
import { 
  Briefcase, 
  Plus, 
  Edit2, 
  Trash2, 
  HelpCircle, 
  Users, 
  Loader2, 
  Copy, 
  Check,
  Send
} from 'lucide-react';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedToken, setCopiedToken] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await API.get('/jobs');
      setJobs(res.data || []);
    } catch (err) {
      setError('Failed to fetch job positions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCopyJobApplyLink = (jobToken) => {
    const applyUrl = `${window.location.origin}/apply/${jobToken}`;
    navigator.clipboard.writeText(applyUrl);
    setCopiedToken(jobToken);
    setTimeout(() => setCopiedToken(''), 2500);
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'inactive' : 'active';
    try {
      await API.put(`/jobs/${job._id}`, { status: newStatus });
      setSuccess(`Job "${job.name}" set to ${newStatus}`);
      fetchJobs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Are you sure you want to delete job "${job.name}"?`)) return;
    try {
      await API.delete(`/jobs/${job._id}`);
      setSuccess(`Job "${job.name}" deleted successfully`);
      fetchJobs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job');
      setTimeout(() => setError(''), 4000);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#311213]">Jobs Management</h1>
          <p className="text-sm text-[#8e706c] mt-1 font-medium">Manage job positions and share candidate registration links (`/apply/:token`)</p>
        </div>
        <Link
          to="/admin/jobs/new"
          className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white font-semibold px-4 py-2.5 rounded-md shadow-sm transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Job</span>
        </Link>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-md text-sm font-semibold">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-300 text-[#800000] px-4 py-3 rounded-md text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Jobs Table */}
      {jobs.length === 0 ? (
        <div className="bg-white border border-[#e2bfb9] rounded-md p-12 text-center shadow-sm">
          <Briefcase className="w-12 h-12 text-[#8e706c] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#311213]">No job positions found</h3>
          <p className="text-sm text-[#8e706c] mt-1">Add your first job (e.g. HR Executive, Software Developer) to get started.</p>
          <Link
            to="/admin/jobs/new"
            className="inline-flex items-center space-x-2 mt-4 bg-[#800000] hover:bg-[#570000] text-white text-sm font-semibold px-4 py-2 rounded-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#e2bfb9] rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#311213]">
              <thead className="bg-[#ffe9e8] text-xs font-bold uppercase text-[#5a413d] border-b border-[#e2bfb9]">
                <tr>
                  <th className="px-6 py-3.5">Job Title & Description</th>
                  <th className="px-6 py-3.5">Share Registration Link</th>
                  <th className="px-6 py-3.5">Question Pool</th>
                  <th className="px-6 py-3.5">Candidates</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffe9e8]">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-[#fff8f7] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#311213] text-base">{job.name}</div>
                      <div className="text-xs text-[#8e706c] mt-0.5 line-clamp-1">
                        {job.description || 'No description provided'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {job.jobToken ? (
                        <button
                          onClick={() => handleCopyJobApplyLink(job.jobToken)}
                          className="flex items-center space-x-1.5 bg-[#800000] hover:bg-[#570000] text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all"
                        >
                          {copiedToken === job.jobToken ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span className="text-emerald-100 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Copy Job Link</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">N/A</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/questions?jobId=${job._id}`}
                        className="inline-flex items-center space-x-1.5 text-[#800000] hover:underline font-semibold"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>{job.questionCount || 0} Questions</span>
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-[#5a413d] font-medium">
                        <Users className="w-4 h-4 text-[#8e706c]" />
                        <span>{job.candidateCount || 0} Candidates</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(job)}
                        title="Click to toggle status"
                        className="focus:outline-none"
                      >
                        <Badge status={job.status} />
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/admin/jobs/${job._id}`}
                          className="p-2 text-[#5a413d] hover:text-[#800000] bg-[#fff0f0] hover:bg-[#ffe1e1] border border-[#e2bfb9] rounded-md transition-colors"
                          title="Edit Job"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(job)}
                          className="p-2 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsList;

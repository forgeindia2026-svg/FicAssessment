import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import Badge from '../../components/Badge';
import { Users, Eye, Trash2, Loader2, Send, Download } from 'lucide-react';

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await API.get('/candidates');
      setCandidates(res.data || []);
    } catch (err) {
      setErrorMsg('Failed to fetch registered candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleExportCSV = () => {
    if (candidates.length === 0) {
      alert('No candidates available to export.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Email,Phone,Job Track,Status,Score,Percentage\n";

    candidates.forEach((c) => {
      const isCompleted = c.assessment?.status === 'COMPLETED';
      const status = isCompleted ? 'COMPLETED' : (c.assessment?.status || c.status || 'REGISTERED');
      const score = c.assessment?.score || 0;
      const total = c.assessment?.totalQuestions || 0;
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      const scoreStr = isCompleted ? `"${score}/${total}"` : '"N/A"';

      const cleanName = `"${(c.name || '').replace(/"/g, '""')}"`;
      const cleanEmail = `"${(c.email || '').replace(/"/g, '""')}"`;
      const cleanTrack = `"${(c.jobId?.name || 'Unassigned').replace(/"/g, '""')}"`;

      csvContent += `${c._id},${cleanName},${cleanEmail},${c.phone || ''},${cleanTrack},${status},${scoreStr},${pct}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fic_candidates_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (candidateId, name) => {
    if (!window.confirm(`Are you sure you want to delete candidate "${name}"?`)) return;
    try {
      await API.delete(`/candidates/${candidateId}`);
      setSuccessMsg(`Deleted candidate "${name}"`);
      fetchCandidates();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete candidate');
      setTimeout(() => setErrorMsg(''), 3000);
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
          <h1 className="text-2xl font-extrabold text-[#311213]">Registered Candidates</h1>
          <p className="text-sm text-[#8e706c] mt-1 font-medium">
            Candidates automatically registered through public job links (`/apply/:jobToken`)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-[#fff0f0] hover:bg-[#ffe9e8] text-[#800000] border border-[#e2bfb9] font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Candidates CSV</span>
          </button>
          <Link
            to="/admin/jobs"
            className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm"
          >
            <Send className="w-4 h-4" />
            <span>View Job Registration Links</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-md text-sm font-semibold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 text-[#800000] px-4 py-3 rounded-md text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Table */}
      {candidates.length === 0 ? (
        <div className="bg-white border border-[#e2bfb9] rounded-md p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-[#8e706c] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#311213]">No candidates registered yet</h3>
          <p className="text-sm text-[#8e706c] mt-1">
            Candidates will automatically appear here when they fill their details on a public Job link (`/apply/:jobToken`).
          </p>
          <Link
            to="/admin/jobs"
            className="inline-flex items-center space-x-2 mt-4 bg-[#800000] hover:bg-[#570000] text-white text-sm font-semibold px-4 py-2 rounded-md transition-all"
          >
            <span>Copy Job Links</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#e2bfb9] rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#311213]">
              <thead className="bg-[#ffe9e8] text-xs font-bold uppercase text-[#5a413d] border-b border-[#e2bfb9]">
                <tr>
                  <th className="px-6 py-3.5">Candidate Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">Assigned Job Track</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Assessment Score</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffe9e8]">
                {candidates.map((c) => {
                  const hasAssessment = Boolean(c.assessment);
                  const isCompleted = c.assessment?.status === 'COMPLETED';
                  const candidateStatus = isCompleted ? 'COMPLETED' : (c.assessment?.status || c.status);
                  
                  let scoreDisplay = 'N/A';
                  if (hasAssessment && isCompleted) {
                    const score = c.assessment.score || 0;
                    const total = c.assessment.totalQuestions || 0;
                    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
                    scoreDisplay = `${score} / ${total} (${pct}%)`;
                  } else if (hasAssessment && c.assessment.status === 'IN_PROGRESS') {
                    scoreDisplay = 'In Progress';
                  }

                  return (
                    <tr key={c._id} className="hover:bg-[#fff8f7] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#311213]">
                        {c.name}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-[#5a413d]">
                        {c.email}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-[#5a413d]">
                        {c.phone || 'N/A'}
                      </td>

                      <td className="px-6 py-4 font-semibold text-[#311213]">
                        {c.jobId?.name || 'Unassigned'}
                      </td>

                      <td className="px-6 py-4">
                        <Badge status={candidateStatus} />
                      </td>

                      <td className="px-6 py-4 font-bold text-[#800000]">
                        {scoreDisplay}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={c.assessment ? `/admin/results/${c.assessment._id}` : `/admin/candidates/${c._id}`}
                            className="p-2 text-[#5a413d] hover:text-[#800000] bg-[#fff0f0] hover:bg-[#ffe1e1] border border-[#e2bfb9] rounded-md transition-colors"
                            title="View Score Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(c._id, c.name)}
                            className="p-2 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesList;

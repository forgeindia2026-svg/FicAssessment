import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import Badge from '../../components/Badge';
import { Award, Eye, Clock, Loader2, Download } from 'lucide-react';

const ResultsList = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await API.get('/results');
        setResults(res.data || []);
      } catch (err) {
        console.error('Failed to fetch results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleExportResultsCSV = () => {
    if (results.length === 0) {
      alert('No assessment results available to export.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Candidate Name,Email,Job Position,Score,Total Questions,Percentage,Time Spent (s),Status,Malpractice Flagged,Malpractice Reason\n";

    results.forEach((r) => {
      const cleanName = `"${(r.candidate?.name || '').replace(/"/g, '""')}"`;
      const cleanEmail = `"${(r.candidate?.email || '').replace(/"/g, '""')}"`;
      const cleanJob = `"${(r.job?.name || 'Unassigned').replace(/"/g, '""')}"`;
      const malFlag = r.malpracticeDetected ? 'YES' : 'NO';
      const cleanReason = `"${(r.malpracticeReason || '').replace(/"/g, '""')}"`;

      csvContent += `${r._id},${cleanName},${cleanEmail},${cleanJob},${r.score || 0},${r.totalQuestions || 0},${r.percentage || 0}%,${r.timeTakenSeconds || 0},${r.status || ''},${malFlag},${cleanReason}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fic_results_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h1 className="text-2xl font-extrabold text-[#311213]">Assessment Results</h1>
          <p className="text-sm text-[#8e706c] mt-1 font-medium">
            Automatic evaluation scores, percentage metrics & candidate performance reports
          </p>
        </div>
        <button
          onClick={handleExportResultsCSV}
          className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Results CSV</span>
        </button>
      </div>

      {/* Results Table */}
      {results.length === 0 ? (
        <div className="bg-white border border-[#e2bfb9] rounded-md p-12 text-center shadow-sm">
          <Award className="w-12 h-12 text-[#8e706c] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#311213]">No assessment results available</h3>
          <p className="text-sm text-[#8e706c] mt-1">
            Once candidates complete test submissions, automated scores will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#e2bfb9] rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#311213]">
              <thead className="bg-[#ffe9e8] text-xs font-bold uppercase text-[#5a413d] border-b border-[#e2bfb9]">
                <tr>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Job Position</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Percentage</th>
                  <th className="px-6 py-3.5">Time Spent</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffe9e8]">
                {results.map((r) => (
                  <tr key={r._id} className="hover:bg-[#fff8f7] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#311213] flex items-center space-x-2">
                        <span>{r.candidate?.name}</span>
                        {r.malpracticeDetected && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase" title={r.malpracticeReason || 'Proctoring violation'}>
                            🚨 Malpractice Flagged
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#8e706c]">{r.candidate?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#311213]">
                      {r.job?.name}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[#800000] text-base">
                      {r.score} <span className="text-xs text-[#8e706c] font-normal">/ {r.totalQuestions}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        r.percentage >= 75
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : r.percentage >= 50
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-300'
                      }`}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#5a413d] font-medium">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-[#8e706c]" />
                        <span>{formatDuration(r.timeTakenSeconds)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/results/${r._id}`}
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#800000] hover:bg-[#ffe1e1] bg-[#fff0f0] border border-[#e2bfb9] px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Detailed Report</span>
                      </Link>
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

export default ResultsList;

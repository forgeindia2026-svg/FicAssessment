import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import Badge from '../../components/Badge';
import { 
  Users, 
  Briefcase, 
  HelpCircle, 
  Award, 
  UserPlus, 
  PlusCircle, 
  FileSpreadsheet, 
  ArrowRight,
  Loader2,
  TrendingUp,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    candidates: 0,
    jobs: 0,
    questions: 0,
    completed: 0
  });
  const [analytics, setAnalytics] = useState({
    highScorers: 0, // >= 75%
    avgScorers: 0,  // 50 - 74%
    lowScorers: 0,  // < 50%
    passRate: 0,
    avgTimeMins: 0,
    trackBreakdown: []
  });
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [candRes, jobRes, qRes, resRes] = await Promise.all([
          API.get('/candidates'),
          API.get('/jobs'),
          API.get('/questions'),
          API.get('/results')
        ]);

        const candidates = candRes.data || [];
        const jobs = jobRes.data || [];
        const questions = qRes.data || [];
        const results = resRes.data || [];

        const completedResults = results.filter(r => r.status === 'COMPLETED');
        const completedCount = completedResults.length;

        // Analytics calculation
        let high = 0;
        let avg = 0;
        let low = 0;
        let totalSecs = 0;
        const jobStatsMap = {};

        completedResults.forEach(r => {
          const pct = r.percentage || 0;
          if (pct >= 75) high++;
          else if (pct >= 50) avg++;
          else low++;

          totalSecs += (r.timeTakenSeconds || 0);

          const trackName = r.job?.name || 'General';
          if (!jobStatsMap[trackName]) {
            jobStatsMap[trackName] = { total: 0, passed: 0 };
          }
          jobStatsMap[trackName].total++;
          if (pct >= 50) jobStatsMap[trackName].passed++;
        });

        const passRate = completedCount > 0 ? Math.round(((high + avg) / completedCount) * 100) : 0;
        const avgTimeMins = completedCount > 0 ? Math.round((totalSecs / completedCount) / 60) : 0;

        const trackBreakdown = Object.entries(jobStatsMap).map(([name, data]) => ({
          name,
          total: data.total,
          passRate: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0
        }));

        setStats({
          candidates: candidates.length,
          jobs: jobs.length,
          questions: questions.length,
          completed: completedCount
        });

        setAnalytics({
          highScorers: high,
          avgScorers: avg,
          lowScorers: low,
          passRate,
          avgTimeMins,
          trackBreakdown
        });

        setRecentCandidates(candidates.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#800000] animate-spin" />
      </div>
    );
  }

  const statCards = [
    { title: 'TOTAL CANDIDATES', value: stats.candidates, icon: Users, color: 'from-blue-600 to-cyan-600', link: '/admin/candidates' },
    { title: 'TOTAL JOB POSITIONS', value: stats.jobs, icon: Briefcase, color: 'from-[#800000] to-rose-700', link: '/admin/jobs' },
    { title: 'TOTAL QUESTION BANK', value: stats.questions, icon: HelpCircle, color: 'from-emerald-600 to-teal-600', link: '/admin/questions' },
    { title: 'COMPLETED TESTS', value: stats.completed, icon: Award, color: 'from-amber-600 to-orange-600', link: '/admin/results' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#311213]">Admin Overview & Performance Dashboard</h1>
          <p className="text-sm text-[#8e706c] mt-1 font-medium">
            Manage jobs, candidates, questions, and view real-time candidate assessment analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/candidates/new"
            className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Candidate</span>
          </Link>
          <Link
            to="/admin/jobs/new"
            className="flex items-center space-x-2 bg-white hover:bg-[#fff0f0] text-[#311213] border border-[#e2bfb9] text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Job</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white border border-[#e2bfb9] rounded-2xl p-6 hover:border-[#800000] transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8e706c] uppercase tracking-wider">{card.title}</span>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#311213]">{card.value}</span>
                <span className="text-xs text-[#800000] font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                  View <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Performance Analytics Dashboard Section */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#800000]" />
            <h2 className="text-base font-bold text-[#311213]">Candidate Performance Analytics & Metrics</h2>
          </div>
          <span className="text-xs font-bold text-[#800000] bg-[#fff0f0] border border-[#e2bfb9] px-3 py-1 rounded-xl">
            Overall Pass Rate: {analytics.passRate}%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Score Distribution Chart Card */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-5 rounded-2xl space-y-4">
            <span className="text-xs font-bold text-[#311213] flex items-center space-x-1.5">
              <PieChart className="w-4 h-4 text-[#800000]" />
              <span>Score Distribution Breakdown</span>
            </span>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-800">High Performers (75 - 100%)</span>
                  <span>{analytics.highScorers} candidates</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-500" 
                    style={{ width: `${stats.completed > 0 ? (analytics.highScorers / stats.completed) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-800">Average Performers (50 - 74%)</span>
                  <span>{analytics.avgScorers} candidates</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${stats.completed > 0 ? (analytics.avgScorers / stats.completed) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-800">Needs Review (&lt; 50%)</span>
                  <span>{analytics.lowScorers} candidates</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-600 h-full transition-all duration-500" 
                    style={{ width: `${stats.completed > 0 ? (analytics.lowScorers / stats.completed) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Completion Pace & Time Card */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#311213] flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-[#800000]" />
                <span>Test Duration & Pacing</span>
              </span>

              <div className="mt-4 text-center py-4 bg-white border border-[#e2bfb9] rounded-xl shadow-xs">
                <span className="text-3xl font-black text-[#800000]">{analytics.avgTimeMins} min</span>
                <span className="text-xs text-[#8e706c] block font-semibold mt-1">Average Candidate Test Time</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#e2bfb9] rounded-xl text-xs text-[#5a413d] font-semibold flex items-center justify-between">
              <span>Overall Evaluation Completion Rate:</span>
              <span className="font-extrabold text-[#800000]">
                {stats.candidates > 0 ? Math.round((stats.completed / stats.candidates) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Job Track Qualification Rate Cards */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-5 rounded-2xl space-y-4">
            <span className="text-xs font-bold text-[#311213] flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-[#800000]" />
              <span>Track Pass Rates</span>
            </span>

            {analytics.trackBreakdown.length === 0 ? (
              <p className="text-xs text-[#8e706c] pt-4 text-center font-medium">No completed track data yet.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {analytics.trackBreakdown.map((t, i) => (
                  <div key={i} className="bg-white border border-[#e2bfb9] p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs font-extrabold text-[#311213]">
                      <span>{t.name}</span>
                      <span className="text-[#800000]">{t.passRate}% Pass</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#800000] h-full" style={{ width: `${t.passRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Quick Links Banner */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-[#311213]">Quick Question Management</h2>
          <p className="text-xs text-[#8e706c] mt-0.5 font-medium">
            Import large MCQ datasets directly or add individual questions to job banks
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/questions/bulk"
            className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk MCQ Import</span>
          </Link>
          <Link
            to="/admin/questions"
            className="flex items-center space-x-2 bg-white hover:bg-[#fff0f0] text-[#311213] border border-[#e2bfb9] px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Manage Question Bank</span>
          </Link>
        </div>
      </div>

      {/* Recent Candidates Table */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#ffe9e8] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#311213]">Recent Candidates & Assessments</h2>
          <Link to="/admin/candidates" className="text-xs font-semibold text-[#800000] hover:underline flex items-center">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        {recentCandidates.length === 0 ? (
          <div className="p-12 text-center text-[#8e706c] text-sm font-medium">
            No candidates added yet. Click "Add Candidate" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#311213]">
              <thead className="bg-[#ffe9e8] text-xs font-bold uppercase text-[#5a413d] border-b border-[#e2bfb9]">
                <tr>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Assigned Job</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffe9e8]">
                {recentCandidates.map((c) => (
                  <tr key={c._id} className="hover:bg-[#fff8f7] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#311213]">{c.name}</div>
                      <div className="text-xs text-[#8e706c]">{c.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#311213]">{c.jobId?.name || 'Unassigned'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-[#8e706c] font-medium">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/candidates/${c._id}`}
                        className="inline-flex items-center text-xs font-semibold text-[#800000] hover:bg-[#ffe1e1] bg-[#fff0f0] border border-[#e2bfb9] px-3 py-1.5 rounded-lg transition-all"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

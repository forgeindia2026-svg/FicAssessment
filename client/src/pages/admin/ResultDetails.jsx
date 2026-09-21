import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import Badge from '../../components/Badge';
import AssessmentCertificateModal from '../../components/AssessmentCertificateModal';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  User, 
  Briefcase, 
  FileText,
  Loader2,
  ShieldAlert,
  Printer
} from 'lucide-react';

const ResultDetails = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await API.get(`/results/${id}`);
        setResult(res.data);
      } catch (err) {
        console.error('Failed to load result report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#800000] animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center p-12 text-[#8e706c] font-medium">
        Assessment result report not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/results"
            className="p-2 text-[#5a413d] hover:text-[#800000] bg-[#fff0f0] hover:bg-[#ffe1e1] border border-[#e2bfb9] rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#311213]">Evaluation Report</h1>
            <p className="text-sm text-[#8e706c] font-medium">Detailed assessment breakdown for {result.candidate?.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCertModal(true)}
            className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF Certificate</span>
          </button>
          <Badge status={result.status} />
        </div>
      </div>

      {/* Malpractice Flagged Banner */}
      {result.malpracticeDetected && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm flex items-start space-x-3.5">
          <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-rose-900">🚨 Malpractice / Proctoring Violation Flagged</h3>
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Auto-Terminated</span>
            </div>
            <p className="text-xs text-rose-800 font-bold">
              Violation Reason: <span className="underline">{result.malpracticeReason || 'Tab switch or window focus lost detected'}</span>
            </p>
            <p className="text-xs text-[#5a413d] font-medium leading-relaxed pt-1">
              This candidate's test session was automatically halted due to proctoring policy violation. The answers shown below reflect their progress up to the moment of termination.
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e2bfb9] p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-[#8e706c] uppercase tracking-wider block mb-1">Final Score</span>
          <div className="text-3xl font-extrabold text-[#800000]">
            {result.score} <span className="text-base text-[#8e706c] font-normal">/ {result.totalQuestions}</span>
          </div>
        </div>

        <div className="bg-white border border-[#e2bfb9] p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-[#8e706c] uppercase tracking-wider block mb-1">Percentage</span>
          <div className="text-3xl font-extrabold text-[#800000]">
            {result.percentage}%
          </div>
        </div>

        <div className="bg-white border border-[#e2bfb9] p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-[#8e706c] uppercase tracking-wider block mb-1">Correct / Incorrect</span>
          <div className="text-base font-bold text-[#311213] flex items-center space-x-3 mt-2">
            <span className="text-emerald-700 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" /> {result.correctCount}
            </span>
            <span className="text-rose-700 flex items-center">
              <XCircle className="w-4 h-4 mr-1" /> {result.incorrectCount}
            </span>
            <span className="text-[#8e706c] flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" /> {result.unansweredCount}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#e2bfb9] p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-[#8e706c] uppercase tracking-wider block mb-1">Time Spent</span>
          <div className="text-lg font-bold text-[#311213] flex items-center mt-2">
            <Clock className="w-5 h-5 text-amber-600 mr-2" />
            <span>{formatDuration(result.timeTakenSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Candidate Profile Summary */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#fff0f0] border border-[#e2bfb9] rounded-xl text-[#800000]">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#311213] text-base">{result.candidate?.name}</h3>
            <p className="text-xs text-[#8e706c] font-medium">{result.candidate?.email} {result.candidate?.phone ? `• ${result.candidate?.phone}` : ''}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="bg-[#ffe9e8] border border-[#e2bfb9] text-[#5a413d] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5">
            <Briefcase className="w-4 h-4 text-[#800000]" />
            <span>Position: {result.job?.name}</span>
          </span>
          {result.candidate?.resume && (
            <a
              href={`/uploads/${result.candidate.resume}`}
              target="_blank"
              rel="noreferrer"
              className="bg-[#fff0f0] hover:bg-[#ffe1e1] border border-[#e2bfb9] text-[#800000] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Resume</span>
            </a>
          )}
        </div>
      </div>

      {/* Proctoring Audit & AI Eye Tracker Summary Card */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-[#800000]" />
            <h3 className="font-bold text-base text-[#311213]">AI Proctoring & Webcam Audit Log</h3>
          </div>
          <span className="text-xs font-bold text-[#800000] bg-[#fff0f0] px-3 py-1 rounded-lg border border-[#e2bfb9]">
            Audit Captured
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-3.5 rounded-xl">
            <span className="text-[#8e706c] font-bold block uppercase mb-1">Tab Switch Warnings</span>
            <span className="text-base font-extrabold text-[#311213]">
              {result.warningCount || 0} / 1 Allowed
            </span>
          </div>

          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-3.5 rounded-xl">
            <span className="text-[#8e706c] font-bold block uppercase mb-1">AI Eye Gaze Alerts</span>
            <span className="text-base font-extrabold text-[#311213]">
              {result.gazeAlertCount || 0} Off-Screen Gaze Alerts
            </span>
          </div>

          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-3.5 rounded-xl">
            <span className="text-[#8e706c] font-bold block uppercase mb-1">Audit Snapshots</span>
            <span className="text-base font-extrabold text-[#800000]">
              {result.snapshots?.length || 0} Captures Saved
            </span>
          </div>
        </div>

        {/* Webcam Audit Photos Gallery */}
        {result.snapshots && result.snapshots.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-bold text-[#311213] block mb-2">Webcam Identity Verification Snapshots:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {result.snapshots.map((snap, idx) => (
                <div key={idx} className="bg-black rounded-xl overflow-hidden border border-[#e2bfb9] shadow-xs relative group">
                  <img
                    src={snap.imageData}
                    alt={`Snapshot ${idx + 1}`}
                    className="w-full h-24 object-cover transform -scale-x-100"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                    {new Date(snap.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Question by Question Itemized Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#311213] pt-2">Question-by-Question Detailed Breakdown</h2>

        {result.questionBreakdown.map((item) => {
          return (
            <div
              key={item.questionId}
              className={`bg-white border-2 rounded-2xl p-6 transition-all space-y-4 shadow-sm ${
                item.isCorrect
                  ? 'border-emerald-300'
                  : item.isUnanswered
                  ? 'border-[#e2bfb9]'
                  : 'border-rose-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <span className="bg-[#ffe9e8] text-[#800000] border border-[#e2bfb9] font-extrabold px-2.5 py-1 rounded-lg text-xs shrink-0 mt-0.5">
                    Q{item.order}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                        item.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        item.difficulty === 'Hard' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {item.difficulty || 'Medium'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#311213] leading-relaxed">{item.question}</h3>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.isCorrect ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct (+1)</span>
                    </span>
                  ) : item.isUnanswered ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-300">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Unanswered</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Incorrect (0)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                {['A', 'B', 'C', 'D'].map((optKey) => {
                  const optText = item[`option${optKey}`];
                  const isUserSelection = item.selectedAnswer === optKey;
                  const isCorrectChoice = item.correctAnswer === optKey;

                  let cardStyle = 'bg-[#fff8f7] border-[#e2bfb9] text-[#5a413d]';
                  if (isCorrectChoice) {
                    cardStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                  } else if (isUserSelection && !isCorrectChoice) {
                    cardStyle = 'bg-rose-50 border-rose-400 text-rose-900 line-through';
                  }

                  return (
                    <div
                      key={optKey}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${cardStyle}`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isCorrectChoice
                            ? 'bg-emerald-600 text-white'
                            : isUserSelection
                            ? 'bg-rose-600 text-white'
                            : 'bg-[#e2bfb9] text-[#5a413d]'
                        }`}>
                          {optKey}
                        </span>
                        <span className="truncate">{optText}</span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 text-[10px] uppercase font-bold tracking-wider">
                        {isUserSelection && (
                          <span className="bg-[#ffe9e8] px-2 py-0.5 rounded text-[#800000] border border-[#e2bfb9]">Your Choice</span>
                        )}
                        {isCorrectChoice && (
                          <span className="bg-emerald-700 px-2 py-0.5 rounded text-white">Correct Answer</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Answer Explanation & Rationale Box */}
              {item.explanation && (
                <div className="ml-9 p-3 bg-[#fff8f7] border border-[#e2bfb9] rounded-xl text-xs text-[#5a413d] font-medium">
                  <span className="font-bold text-[#800000] block mb-0.5">Answer Rationale & Learning Feedback:</span>
                  <p>{item.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showCertModal && (
        <AssessmentCertificateModal
          result={result}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
};

export default ResultDetails;

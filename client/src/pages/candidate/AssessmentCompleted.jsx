import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../services/api';
import { CheckCircle, AlertTriangle, ShieldAlert, Award, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react';

const AssessmentCompleted = () => {
  const { token } = useParams();
  const location = useLocation();

  const [assessmentResult, setAssessmentResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [malpracticeInfo, setMalpracticeInfo] = useState({
    detected: location.state?.malpracticeDetected || false,
    reason: location.state?.malpracticeReason || ''
  });

  useEffect(() => {
    if (token) {
      axios.get(getApiUrl(`/assessment/${token}`))
        .then(res => {
          const data = res.data;
          setAssessmentResult(data);
          if (data.malpracticeDetected) {
            setMalpracticeInfo({
              detected: true,
              reason: data.malpracticeReason || 'Proctoring policy violation detected'
            });
          }
        })
        .catch(err => console.warn('Could not fetch assessment status:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const isMalpractice = malpracticeInfo.detected;
  const score = assessmentResult?.score || 0;
  const totalQuestions = assessmentResult?.totalQuestions || 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#fff8f7] flex flex-col items-center justify-center p-4 select-none font-sans text-[#311213]">
      <div className="w-full max-w-lg bg-white border-2 border-[#e2bfb9] rounded-2xl shadow-xl p-8 text-center space-y-6">
        
        {/* Company Header */}
        <div className="space-y-2 border-b border-[#ffe9e8] pb-4">
          <img
            src="/logo.png"
            alt="Forge India Connect Logo"
            className="w-16 h-16 rounded-full mx-auto border-2 border-[#e2bfb9] object-cover shadow-sm"
          />
          <h2 className="text-xs font-black text-[#800000] tracking-widest uppercase">FORGE INDIA CONNECT</h2>
          <p className="text-xs text-[#8e706c] font-semibold">Candidate Assessment System</p>
        </div>

        {isMalpractice ? (
          /* Malpractice Auto-Termination UI */
          <div className="space-y-4">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-full inline-block shadow-sm">
              <ShieldAlert className="w-12 h-12 text-rose-700" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-rose-900">
                Assessment Auto-Terminated
              </h1>
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Malpractice / Proctoring Violation Detected
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-left space-y-2">
              <div className="flex items-center space-x-1.5 text-rose-900 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Violation Trigger:</span>
              </div>
              <p className="text-xs text-rose-800 font-semibold leading-relaxed">
                <span className="font-bold underline">{malpracticeInfo.reason || 'Tab switch or browser focus loss detected.'}</span>
              </p>
              <p className="text-[11px] text-[#5a413d] font-normal leading-relaxed pt-1 border-t border-rose-200">
                Per assessment proctoring policies, your test session was terminated. Your progress up to the moment of violation has been locked and recorded for admin review.
              </p>
            </div>

            {/* Scorecard up to termination */}
            {assessmentResult && (
              <div className="bg-[#fff8f7] border border-[#e2bfb9] rounded-xl p-4 space-y-1 text-xs">
                <span className="text-[#8e706c] font-bold block uppercase">Recorded Score Before Termination</span>
                <span className="text-2xl font-black text-rose-800">
                  {score} / {totalQuestions} <span className="text-sm font-bold text-[#8e706c]">({percentage}%)</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Normal Completion & Full Candidate Result Display */
          <div className="space-y-5">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full inline-block shadow-sm">
              <CheckCircle className="w-12 h-12 text-emerald-600 animate-bounce-once" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[#311213]">Assessment Completed!</h1>
              <p className="text-xs text-[#8e706c] font-medium">
                Your responses have been evaluated and scored automatically.
              </p>
            </div>

            {/* CANDIDATE SCORECARD DISPLAY CARD */}
            <div className="bg-[#fff8f7] border-2 border-[#e2bfb9] rounded-2xl p-6 space-y-4 shadow-sm text-center">
              <span className="text-xs font-black text-[#800000] tracking-widest uppercase block">
                YOUR ASSESSMENT RESULT
              </span>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-[#e2bfb9]">
                <div>
                  <span className="text-[10px] font-bold text-[#8e706c] uppercase block mb-1">Final Score</span>
                  <span className="text-3xl font-black text-[#800000]">
                    {score} <span className="text-xs font-normal text-[#8e706c]">/ {totalQuestions}</span>
                  </span>
                </div>

                <div className="border-l border-[#e2bfb9]">
                  <span className="text-[10px] font-bold text-[#8e706c] uppercase block mb-1">Percentage</span>
                  <span className="text-3xl font-black text-[#800000]">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Qualification Status Pill */}
              <div>
                <span className={`inline-block text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-xs ${
                  percentage >= 75
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : percentage >= 50
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {percentage >= 75 ? '🏆 Excellent Qualification' : percentage >= 50 ? '✅ Passed / Qualified' : '⚠️ Needs Improvement'}
                </span>
              </div>

              {/* Position Track Info */}
              {assessmentResult?.job && (
                <div className="pt-2 text-xs text-[#5a413d] font-semibold flex items-center justify-between border-t border-[#ffe9e8]">
                  <span>Applied Track:</span>
                  <strong className="text-[#800000] font-bold">{assessmentResult.job.name}</strong>
                </div>
              )}
            </div>

            <div className="bg-[#fff8f7] border border-[#e2bfb9] p-4 rounded-xl text-xs text-[#5a413d] font-semibold space-y-1 text-left">
              <p className="font-extrabold text-[#800000] uppercase tracking-wider text-[11px]">What happens next?</p>
              <p className="text-xs text-[#8e706c] font-medium leading-relaxed">
                The hiring administration team will review your detailed result report and contact you regarding the next steps of your selection process.
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-[#ffe9e8] text-[11px] text-[#8e706c] font-semibold">
          FORGE INDIA CONNECT • {isMalpractice ? 'Proctored Test Session Halted' : 'Evaluation Result Generated'}
        </div>

      </div>
    </div>
  );
};

export default AssessmentCompleted;

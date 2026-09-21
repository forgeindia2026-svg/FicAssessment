import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Send,
  Video,
  ShieldAlert,
  X,
  Lock
} from 'lucide-react';
import EyeTrackerWidget from '../../components/EyeTrackerWidget';

const ActualAssessment = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [assessmentData, setAssessmentData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);

  // Proctoring, Warning & Auto-Exit State
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [autoTerminated, setAutoTerminated] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [gazeAlertCount, setGazeAlertCount] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const warningCountRef = useRef(0);

  // Fetch Assessment & Initialize Test Session
  useEffect(() => {
    const initializeTest = async () => {
      try {
        const res = await axios.post(`/api/assessment/${token}/start`);
        const data = res.data;

        if (data.status === 'COMPLETED') {
          navigate(`/assessment/${token}/completed`);
          return;
        }

        setAssessmentData(data);
        setQuestions(data.questions || []);
        setSelectedAnswers(data.answers || {});

        // Compute remaining server time in seconds
        if (data.expiresAt) {
          const expireTime = new Date(data.expiresAt).getTime();
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expireTime - now) / 1000));
          setTimeLeft(remaining);
        } else {
          setTimeLeft(30 * 60);
        }

        // Initialize Webcam Stream for Proctored Widget & Snapshots
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (camErr) {
          console.warn('Webcam stream initialization warning:', camErr);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize assessment test.');
      } finally {
        setLoading(false);
      }
    };

    initializeTest();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [token, navigate]);

  // Request Fullscreen on Mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        }
      } catch (e) {
        console.warn('Auto fullscreen request blocked by browser:', e);
      }
    };
    enterFullscreen();
  }, []);

  // Copy/Paste & Context Menu & Shortcut Prevention
  useEffect(() => {
    if (loading || submitting) return;

    const preventCopy = (e) => {
      e.preventDefault();
      return false;
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const preventSelect = (e) => {
      e.preventDefault();
      return false;
    };

    const preventShortcuts = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'u' || e.key === 'U' || e.key === 'x' || e.key === 'X')) ||
        (e.metaKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('paste', preventCopy);
    document.addEventListener('selectstart', preventSelect);
    document.addEventListener('keydown', preventShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('selectstart', preventSelect);
      document.removeEventListener('keydown', preventShortcuts);
    };
  }, [loading, submitting]);

  // Periodic Background Webcam Snapshot Captures (Every 45 seconds)
  useEffect(() => {
    if (loading || submitting || autoTerminated) return;

    const captureSnapshot = async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.6);

        await axios.post(`/api/assessment/${token}/snapshot`, { imageData });
      } catch (snapErr) {
        console.warn('Snapshot capture warning:', snapErr);
      }
    };

    const snapshotInterval = setInterval(captureSnapshot, 45000);
    return () => clearInterval(snapshotInterval);
  }, [loading, submitting, autoTerminated, token]);

  // 1-Warning Strike & 2nd Strike Auto-Termination Handler
  const handleProctoringViolation = async (reason) => {
    if (isSubmittingRef.current || autoTerminated) return;

    const currentCount = warningCountRef.current;

    if (currentCount === 0) {
      // 1st Strike: Log warning and display warning modal
      warningCountRef.current = 1;
      setWarningCount(1);
      setWarningReason(reason);
      setShowWarningModal(true);

      try {
        await axios.post(`/api/assessment/${token}/warning`, {
          reason,
          gazeAlertCount
        });
      } catch (err) {
        console.warn('Warning logging error:', err);
      }
    } else {
      // 2nd Strike: Auto-terminate test immediately!
      isSubmittingRef.current = true;
      setAutoTerminated(true);
      setSubmitting(true);
      setShowWarningModal(false);

      const finalReason = `${reason} (2nd Violation - Test Terminated)`;

      try {
        await axios.post(`/api/assessment/${token}/submit`, {
          malpracticeDetected: true,
          malpracticeReason: finalReason,
          terminationType: 'MALPRACTICE_AUTO_TERMINATED'
        });

        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.error('Auto exit submission error:', err);
      } finally {
        navigate(`/assessment/${token}/completed`, {
          state: {
            malpracticeDetected: true,
            malpracticeReason: finalReason
          }
        });
      }
    }
  };

  // Visibility & Focus Listeners
  useEffect(() => {
    if (loading || submitting || autoTerminated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleProctoringViolation('Tab switch or browser window minimize detected');
      }
    };

    const handleWindowBlur = () => {
      handleProctoringViolation('Window focus lost');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleProctoringViolation('Exited full screen mode');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [loading, submitting, autoTerminated, gazeAlertCount]);

  // Timer Countdown Effect
  useEffect(() => {
    if (loading || timeLeft <= 0 || submitting) return;

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [loading, timeLeft, submitting]);

  // Save selected answer to backend
  const handleSelectOption = async (qId, optionKey) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionKey
    }));

    try {
      await axios.post(`/api/assessment/${token}/answer`, {
        questionId: qId,
        selectedAnswer: optionKey
      });
    } catch (err) {
      console.error('Auto-save answer error:', err);
    }
  };

  // Final Manual Assessment Submission
  const handleSubmitAssessment = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setShowSubmitModal(false);

    try {
      await axios.post(`/api/assessment/${token}/submit`, {
        malpracticeDetected: false,
        terminationType: 'NORMAL_SUBMIT'
      });

      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }

      navigate(`/assessment/${token}/completed`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assessment');
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitAssessment();
  };

  const handleGazeDeviation = (alertCount) => {
    setGazeAlertCount(alertCount);
    // If gaze deviation exceeds 6 consecutive warnings, issue a proctoring violation strike
    if (alertCount > 0 && alertCount % 6 === 0) {
      handleProctoringViolation(`Persistent gaze off-screen / eye deviation detected (${alertCount} alerts)`);
    }
  };

  // Format timer seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f7] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#800000] animate-spin" />
        <p className="text-sm font-semibold text-[#311213]">Initializing AI-Proctored assessment session...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center p-4">
        <div className="bg-white border border-[#e2bfb9] rounded-md p-8 max-w-md w-full text-center space-y-4 shadow-lg">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-[#311213]">Assessment Error</h2>
          <p className="text-sm text-[#8e706c]">{error || 'No questions available for this test session.'}</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;
  const avgSecPerQ = questions.length > 0 ? Math.round(timeLeft / questions.length) : 60;

  return (
    <div className="min-h-screen bg-[#fff8f7] flex flex-col justify-between select-none font-sans text-[#311213] relative">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#e2bfb9] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Forge India Connect" className="w-9 h-9 rounded-full border border-[#e2bfb9] object-cover" />
          <div>
            <h1 className="font-extrabold text-sm text-[#311213] uppercase tracking-wide">FORGE INDIA CONNECT</h1>
            <p className="text-xs text-[#800000] font-bold">Position: {assessmentData?.jobName}</p>
          </div>
        </div>

        {/* Server & Section Timers */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 bg-[#fff8f7] border border-[#e2bfb9] px-3.5 py-1.5 rounded-md text-xs">
            <span className="text-[#8e706c] font-semibold">Pacing Target:</span>
            <span className="font-bold text-[#800000]">{formatTime(avgSecPerQ)}/Q</span>
          </div>

          <div className="flex items-center space-x-2 bg-[#fff0f0] border border-[#e2bfb9] px-4 py-2 rounded-md">
            <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-700 animate-pulse' : 'text-[#800000]'}`} />
            <span className={`font-mono text-base font-bold ${timeLeft < 300 ? 'text-rose-700 font-black' : 'text-[#311213]'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center space-x-1.5 bg-[#800000] hover:bg-[#570000] text-white px-5 py-2 rounded-md text-xs font-bold shadow transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* Main Assessment Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Question Content */}
        <div className="lg:col-span-3 bg-white border border-[#e2bfb9] rounded-md p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-4">
            <span className="text-xs font-bold text-[#8e706c] uppercase tracking-wider">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#800000] bg-[#fff0f0] px-2.5 py-1 rounded border border-[#e2bfb9] flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Anti-Cheating Active</span>
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#311213] leading-relaxed">
              {currentQ.question}
            </h2>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optVal = currentQ[`option${optKey}`];
                if (!optVal) return null;
                const isSelected = selectedAnswers[currentQ.id] === optKey;

                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelectOption(currentQ.id, optKey)}
                    className={`w-full text-left p-4 rounded-md border text-sm font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#ffe9e8] text-[#800000] border-[#800000] shadow-sm'
                        : 'bg-[#fff8f7] text-[#311213] border-[#e2bfb9] hover:bg-[#fff0f0]'
                    }`}
                  >
                    <span className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                        isSelected ? 'bg-[#800000] text-white border-[#800000]' : 'bg-white text-[#5a413d] border-[#e2bfb9]'
                      }`}>
                        {optKey}
                      </span>
                      <span>{optVal}</span>
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-[#800000]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[#ffe9e8]">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="px-5 py-2.5 rounded-md border border-[#e2bfb9] text-[#5a413d] hover:bg-[#fff0f0] text-xs font-bold disabled:opacity-40 transition-all cursor-pointer"
            >
              Previous Question
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="px-6 py-2.5 rounded-md bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold shadow transition-all cursor-pointer"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-2.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition-all cursor-pointer"
              >
                Review & Submit
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Proctored Camera & Eye Tracker Widget */}
        <div className="space-y-5">
          {/* Live Proctored Camera Widget */}
          <div className="bg-white border border-[#e2bfb9] rounded-md p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#311213] flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-[#800000]" />
                <span>Live Camera Feed</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="bg-black rounded-md h-32 overflow-hidden relative border border-[#e2bfb9]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                Webcam Audit Active
              </span>
            </div>
          </div>

          {/* AI Eye & Gaze Tracker Widget */}
          <EyeTrackerWidget
            videoRef={videoRef}
            onGazeDeviation={handleGazeDeviation}
          />

          {/* Question Grid Drawer */}
          <div className="bg-white border border-[#e2bfb9] rounded-md p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-3">
              <span className="text-xs font-bold text-[#311213]">Question Grid</span>
              <span className="text-xs font-bold text-[#800000]">
                {answeredCount}/{questions.length} Answered
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((qItem, idx) => {
                const isAnswered = Boolean(selectedAnswers[qItem.id]);
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={qItem.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-md text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-[#800000] bg-[#ffe9e8] text-[#800000] border-[#800000]'
                        : isAnswered
                        ? 'bg-[#800000] text-white border-[#800000]'
                        : 'bg-[#fff8f7] text-[#5a413d] border-[#e2bfb9] hover:bg-[#fff0f0]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 1st Strike Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-rose-500 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center animate-bounce-once">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-full inline-block">
              <ShieldAlert className="w-10 h-10 text-rose-700" />
            </div>

            <div className="space-y-1">
              <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                FINAL PROCTORING WARNING (1/1)
              </span>
              <h3 className="text-lg font-extrabold text-rose-900 pt-1">
                Proctoring Anomaly Detected!
              </h3>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-900 font-bold text-left space-y-1">
              <p>Trigger: <span className="underline">{warningReason}</span></p>
              <p className="text-[11px] font-semibold text-[#5a413d] pt-1">
                Navigating away from the test window or looking away again will <strong>IMMEDIATELY TERMINATE</strong> your assessment and lock your score.
              </p>
            </div>

            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow transition-all cursor-pointer"
            >
              I Understand - Resume Test
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-white border border-[#e2bfb9] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-center">
            <h3 className="text-lg font-bold text-[#311213]">Submit Assessment?</h3>
            <p className="text-xs text-[#8e706c]">
              You have answered <strong className="text-[#800000] font-bold">{answeredCount} out of {questions.length}</strong> questions. Are you sure you want to finalize and submit your test?
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-[#e2bfb9] text-[#5a413d] hover:bg-[#fff0f0] text-xs font-semibold cursor-pointer"
              >
                Continue Answering
              </button>
              <button
                onClick={handleSubmitAssessment}
                disabled={submitting}
                className="flex items-center space-x-1.5 bg-[#800000] hover:bg-[#570000] disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs shadow cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActualAssessment;

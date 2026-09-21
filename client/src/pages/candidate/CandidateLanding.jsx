import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../services/api';
import { 
  Play, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  ShieldCheck,
  Video,
  Mic,
  Lock,
  Eye,
  ShieldAlert,
  CheckSquare,
  Square
} from 'lucide-react';

const CandidateLanding = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hardware Status State
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [hardwareError, setHardwareError] = useState('');

  // Acknowledgement Checkbox State
  const [acknowledged, setAcknowledged] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await axios.get(getApiUrl(`/assessment/${token}`));
        setAssessment(res.data);

        // If already completed, redirect to completed page
        if (res.data.status === 'COMPLETED') {
          navigate(`/assessment/${token}/completed`);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired assessment link token.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [token, navigate]);

  // Request & Verify Webcam and Microphone Hardware Permissions
  useEffect(() => {
    const initHardware = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();

        setHasCamera(videoTracks.length > 0 && videoTracks[0].enabled);
        setHasMic(audioTracks.length > 0 && audioTracks[0].enabled);

        // Monitor Microphone Audio Level
        if (audioTracks.length > 0) {
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const audioCtx = new AudioContext();
              audioContextRef.current = audioCtx;
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 256;
              const source = audioCtx.createMediaStreamSource(stream);
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);

              const checkAudioLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
                animFrameRef.current = requestAnimationFrame(checkAudioLevel);
              };

              checkAudioLevel();
            }
          } catch (audioErr) {
            console.warn('Audio analyser init warning:', audioErr);
          }
        }
      } catch (err) {
        console.error('Camera/Mic permission error:', err);
        setHardwareError('Camera and Microphone access are required to take this proctored assessment. Please allow browser permissions.');
        setHasCamera(false);
        setHasMic(false);
      }
    };

    if (!loading && assessment) {
      initHardware();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [loading, assessment]);

  const handleStartTest = async () => {
    if (!acknowledged || !hasCamera || !hasMic) return;

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      console.warn('Fullscreen request:', e);
    }

    navigate(`/assessment/${token}/test`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f7] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#800000] animate-spin" />
        <p className="text-sm font-semibold text-[#311213]">Initializing candidate assessment portal & hardware check...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center p-4">
        <div className="bg-white border border-[#e2bfb9] rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-lg">
          <img
            src="/logo.png"
            alt="Forge India Connect Logo"
            className="w-16 h-16 rounded-full mx-auto border border-[#e2bfb9] object-cover"
          />
          <h2 className="text-xl font-bold text-[#311213]">Link Expired or Invalid</h2>
          <p className="text-sm text-[#8e706c]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f7] flex flex-col items-center justify-center p-4 py-8 select-none font-sans text-[#311213]">
      <div className="w-full max-w-3xl bg-white border-2 border-[#e2bfb9] rounded-2xl shadow-xl overflow-hidden space-y-6">
        
        {/* Header Banner */}
        <div className="bg-[#800000] p-6 text-center text-white relative">
          <img
            src="/logo.png"
            alt="Forge India Connect Logo"
            className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-white/80 shadow-md object-cover"
          />
          <h1 className="text-lg font-extrabold text-white tracking-wide uppercase">FORGE INDIA CONNECT</h1>
          <p className="text-rose-200 text-xs mt-0.5 font-semibold">Proctored Assessment Rules & Hardware Acknowledgement</p>
        </div>

        <div className="p-6 sm:p-8 pt-0 space-y-6">
          
          {/* Candidate & Job Info Box */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-[#8e706c] uppercase tracking-wider block mb-0.5">Candidate</span>
              <h2 className="text-lg font-extrabold text-[#311213]">{assessment.candidate?.name}</h2>
              <p className="text-xs text-[#8e706c] font-medium">{assessment.candidate?.email}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-[#8e706c] uppercase tracking-wider block mb-0.5">Assigned Position Track</span>
              <p className="text-base font-extrabold text-[#800000]">{assessment.job?.name}</p>
              <p className="text-xs font-bold text-[#5a413d]">
                {assessment.totalQuestions || 10} MCQs • 30 Minutes
              </p>
            </div>
          </div>

          {/* SECTION 1: HARDWARE CHECK WIDGET (CAMERA & MIC) */}
          <div className="bg-white border-2 border-[#e2bfb9] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-3">
              <div className="flex items-center space-x-2">
                <Video className="w-5 h-5 text-[#800000]" />
                <h3 className="font-extrabold text-sm text-[#311213]">Hardware & Device Verification</h3>
              </div>
              <span className="text-[10px] font-bold uppercase text-[#800000] bg-[#fff0f0] px-2.5 py-0.5 rounded border border-[#e2bfb9]">
                Live Check
              </span>
            </div>

            {hardwareError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{hardwareError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Live Webcam Preview */}
              <div className="bg-black rounded-xl h-36 overflow-hidden relative border border-[#e2bfb9] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <span className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${hasCamera ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span>{hasCamera ? 'Camera Active' : 'Camera Off'}</span>
                </span>
              </div>

              {/* Microphone & Status Metrics */}
              <div className="space-y-3 bg-[#fff8f7] border border-[#e2bfb9] p-4 rounded-xl text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-[#311213]">
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Webcam Permission:</span>
                  </span>
                  <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${hasCamera ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {hasCamera ? 'GRANTED' : 'REQUIRED'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-[#311213]">
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>Microphone Permission:</span>
                  </span>
                  <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${hasMic ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {hasMic ? 'GRANTED' : 'REQUIRED'}
                  </span>
                </div>

                {/* Live Mic Level Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-[#8e706c]">
                    <span>Microphone Audio Input Meter</span>
                    <span className="text-[#800000]">{micVolume}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full transition-all duration-100" style={{ width: `${micVolume}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PROCTORING & ANTI-CHEATING RULES */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-[#311213] uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-[#800000]" />
              <span>Strict AI Proctoring & Examination Rules</span>
            </h3>

            <div className="bg-[#fff8f7] border border-[#e2bfb9] p-4 rounded-2xl space-y-2.5 text-xs text-[#5a413d] font-medium leading-relaxed">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-rose-900 font-extrabold">1-Warning Strike Rule:</strong> Navigating away from the test tab or losing window focus will issue <strong>1 final warning modal</strong>. A 2nd violation will <strong>IMMEDIATELY TERMINATE</strong> your assessment and lock your score.
                </p>
              </div>

              <div className="flex items-start space-x-2.5">
                <Lock className="w-4 h-4 text-[#800000] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#311213] font-bold">Mandatory Full Screen:</strong> The test must be taken in Full Screen mode. Exiting full screen mode triggers a proctoring violation strike.
                </p>
              </div>

              <div className="flex items-start space-x-2.5">
                <Eye className="w-4 h-4 text-[#800000] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#311213] font-bold">AI Eye & Gaze Tracking:</strong> Continuous face and eye gaze tracking monitors head position. Repeatedly looking away off-screen triggers proctoring alerts.
                </p>
              </div>

              <div className="flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#800000] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#311213] font-bold">Copy/Paste & Shortcut Prevention:</strong> Right-clicking, selecting text, copy-pasting, and developer shortcuts (<kbd className="bg-white border px-1 rounded text-[10px]">F12</kbd>, <kbd className="bg-white border px-1 rounded text-[10px]">Ctrl+C</kbd>, <kbd className="bg-white border px-1 rounded text-[10px]">Ctrl+V</kbd>) are strictly disabled.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: CANDIDATE ACKNOWLEDGEMENT CHECKBOX */}
          <div
            onClick={() => setAcknowledged(!acknowledged)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
              acknowledged
                ? 'bg-[#ffe9e8] border-[#800000] text-[#800000]'
                : 'bg-[#fff8f7] border-[#e2bfb9] text-[#311213] hover:bg-[#fff0f0]'
            }`}
          >
            {acknowledged ? (
              <CheckSquare className="w-5 h-5 text-[#800000] shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-[#8e706c] shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-bold leading-relaxed">
              <p className="text-[#311213]">
                I hereby confirm that I have read, understood, and agree to follow all proctored assessment rules above. I grant permission for continuous camera & microphone monitoring and webcam identity verification snapshots.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => navigate(`/assessment/${token}/demo`)}
              className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-[#fff0f0] text-[#800000] border border-[#e2bfb9] font-bold py-3 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Try Demo Practice Test</span>
            </button>

            <button
              onClick={handleStartTest}
              disabled={!acknowledged || !hasCamera || !hasMic}
              className="w-full flex items-center justify-center space-x-2 bg-[#800000] hover:bg-[#570000] disabled:opacity-40 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all text-xs cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>I Agree & Start Assessment</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CandidateLanding;

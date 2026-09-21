import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import SystemCheckModal from './SystemCheckModal';

const demoQuestions = [
  {
    id: 1,
    question: "What is the primary purpose of an assessment timer?",
    options: ["To limit test duration", "To test internet speed", "To download files", "To change page layout"],
    answer: 0
  },
  {
    id: 2,
    question: "How are candidate answers saved during the test?",
    options: ["Only at final submission", "Automatically upon selecting an option", "By clicking save file", "Answers cannot be saved"],
    answer: 1
  },
  {
    id: 3,
    question: "What happens when the 30-minute timer expires?",
    options: ["The test resets to 0", "Test is automatically submitted with saved answers", "Timer stops and waits infinitely", "Browser closes automatically"],
    answer: 1
  }
];

const DemoTest = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [showSystemCheck, setShowSystemCheck] = useState(false);

  const q = demoQuestions[currentIdx];

  const handleSelectOption = (optIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [q.id]: optIdx
    }));
  };

  const calculateScore = () => {
    let score = 0;
    demoQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.answer) {
        score++;
      }
    });
    return score;
  };

  const handlePermissionsGranted = () => {
    setShowSystemCheck(false);
    navigate(`/assessment/${token}/test`);
  };

  return (
    <div className="min-h-screen bg-[#fff8f7] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-[#e2bfb9] rounded-md shadow-lg overflow-hidden space-y-6">
        {/* Header */}
        <div className="bg-[#800000] p-6 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Forge India Connect" className="w-9 h-9 rounded-full border border-white/60 object-cover" />
            <div>
              <h1 className="font-extrabold text-base uppercase tracking-wide">FORGE INDIA CONNECT</h1>
              <p className="text-rose-200 text-xs font-semibold">Demo Practice Test (Step 1 of 2)</p>
            </div>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-md text-xs font-bold">Practice Mode</span>
        </div>

        {!showResult ? (
          <div className="p-8 pt-0 space-y-6">
            {/* Question Counter */}
            <div className="flex items-center justify-between text-xs font-bold text-[#8e706c] uppercase border-b border-[#ffe9e8] pb-3">
              <span>Question {currentIdx + 1} of {demoQuestions.length}</span>
              <span>Demo Test</span>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#311213]">{q.question}</h2>

              <div className="space-y-2.5">
                {q.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[q.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-4 rounded-md border text-sm font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#ffe9e8] text-[#800000] border-[#800000] shadow-sm'
                          : 'bg-[#fff8f7] text-[#311213] border-[#e2bfb9] hover:bg-[#fff0f0]'
                      }`}
                    >
                      <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#800000]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#ffe9e8]">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="px-4 py-2 rounded-md border border-[#e2bfb9] text-[#5a413d] hover:bg-[#fff0f0] text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>

              {currentIdx < demoQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="px-5 py-2 rounded-md bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold shadow transition-all flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowResult(true)}
                  className="px-5 py-2 rounded-md bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold shadow transition-all"
                >
                  Complete Demo Practice
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 pt-0 text-center space-y-6">
            <div className="p-4 bg-[#fff8f7] border border-[#e2bfb9] rounded-md space-y-2">
              <h2 className="text-xl font-extrabold text-[#311213]">Demo Practice Completed</h2>
              <p className="text-sm text-[#8e706c]">Your Demo Score: <strong className="text-[#800000] text-lg font-black">{calculateScore()} / {demoQuestions.length}</strong></p>
              <p className="text-xs text-[#5a413d]">You have completed the demo test! Proceed to system hardware check & camera verification to launch the actual test.</p>
            </div>

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setCurrentIdx(0);
                  setShowResult(false);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-md border border-[#e2bfb9] text-[#5a413d] hover:bg-[#fff0f0] text-xs font-bold transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Demo</span>
              </button>

              <button
                onClick={() => setShowSystemCheck(true)}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-md bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold shadow transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Proceed to System & Hardware Check</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showSystemCheck && (
        <SystemCheckModal
          onPermissionsGranted={handlePermissionsGranted}
          onCancel={() => setShowSystemCheck(false)}
        />
      )}
    </div>
  );
};

export default DemoTest;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowRight, ShieldCheck, UserCheck, HelpCircle, Briefcase, FileText } from 'lucide-react';

const CandidateTokenEntry = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setError('Please enter your assessment token');
      return;
    }
    navigate(`/assessment/${cleanToken}`);
  };

  return (
    <div className="min-h-screen bg-[#fff8f7] flex flex-col justify-between selection:bg-[#800000] selection:text-white font-sans text-[#311213]">
      {/* Header */}
      <header className="border-b border-[#e2bfb9] bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full border border-[#e2bfb9] object-cover" />
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#311213] block leading-none uppercase">
                FORGE INDIA CONNECT
              </span>
              <span className="text-[10px] font-bold text-[#800000] uppercase tracking-wider">
                Candidate Assessment Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/login"
              className="text-xs font-bold text-[#800000] hover:text-[#570000] px-3.5 py-2 border border-[#e2bfb9] rounded-lg hover:bg-[#fff0f0] transition-all"
            >
              Admin Login →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full px-6 py-12 space-y-8 my-auto">
        <div className="bg-white border-2 border-[#e2bfb9] rounded-2xl shadow-xl overflow-hidden space-y-6">
          {/* Top Banner */}
          <div className="bg-[#800000] p-8 text-center text-white">
            <UserCheck className="w-12 h-12 mx-auto mb-2 text-rose-200" />
            <h1 className="text-xl font-extrabold text-white uppercase tracking-wide">Candidate Assessment Access</h1>
            <p className="text-xs text-rose-200 mt-1 font-semibold">Enter your token to start your timed test</p>
          </div>

          <form onSubmit={handleStart} className="p-8 pt-2 space-y-6">
            {error && (
              <div className="bg-[#fff0f0] border border-[#e2bfb9] rounded-xl p-4 text-xs font-bold text-[#800000] text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#5a413d] uppercase tracking-wider">
                Enter Assessment Token *
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-[#8e706c] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 403fe95129e908873ae82288f402f8366ca25e163ef3e7b2"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl pl-11 pr-4 py-3 text-xs font-mono text-[#311213] focus:outline-none focus:border-[#800000] shadow-inner"
                />
              </div>
              <p className="text-[11px] text-[#8e706c]">
                Token provided by your recruiter or admin via assessment link.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm cursor-pointer"
            >
              <span>Access Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Notice */}
          <div className="bg-[#fff8f7] border-t border-[#e2bfb9] p-5 text-center text-xs text-[#5a413d] space-y-1">
            <div className="flex items-center justify-center space-x-1.5 font-bold text-[#800000]">
              <ShieldCheck className="w-4 h-4" />
              <span>Camera & Microphone Access Required</span>
            </div>
            <p className="text-[11px] text-[#8e706c]">
              Please ensure your webcam and microphone permissions are enabled before starting.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-[#e2bfb9] bg-white text-center text-xs text-[#8e706c]">
        © 2026 FORGE INDIA CONNECT Assessment Portal. All rights reserved.
      </footer>
    </div>
  );
};

export default CandidateTokenEntry;

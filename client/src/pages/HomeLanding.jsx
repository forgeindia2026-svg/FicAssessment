import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  LogIn, 
  Briefcase, 
  CheckCircle2, 
  FileSpreadsheet, 
  Clock, 
  Award, 
  ArrowRight,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';

const HomeLanding = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20 text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
                FIC ASSESSMENT
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Evaluation System
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/admin/login"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Glowing background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-full text-xs font-semibold text-blue-400 shadow-xl">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Internal Candidate Assessment & Evaluation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Streamlined Candidate Testing & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Automated Evaluation</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Manage dynamic job position tracks, bulk import MCQ question banks, share unique public registration links, and deliver secure timed candidate assessments.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/admin/login"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Access Admin Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 bg-slate-900/50 border-t border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Platform Features</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">Built for Complete Candidate Evaluation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700 transition-all">
              <div className="p-3.5 bg-blue-950 border border-blue-800/60 rounded-xl text-blue-400 w-fit">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Job Tracks & Apply Links</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Create any job category (HR, Developer, QA, Finance) with custom public registration links (`/apply/:token`) for seamless candidate applications.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700 transition-all">
              <div className="p-3.5 bg-indigo-950 border border-indigo-800/60 rounded-xl text-indigo-400 w-fit">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Bulk Question Import Parser</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Copy and paste 50+ raw MCQs directly from external documents with automated validation preview reports prior to insertion.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-2xl space-y-4 hover:border-slate-700 transition-all">
              <div className="p-3.5 bg-emerald-950 border border-emerald-800/60 rounded-xl text-emerald-400 w-fit">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Authoritative Timed Tests</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Tokenized secure candidate test links with randomized question order, answer persistence, and server-authoritative auto-submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-400">FIC Assessment Platform</span>
          </div>
          <p>© 2026 FIC Internal Candidate Assessment System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomeLanding;

import React from 'react';
import { X, Printer, Award, CheckCircle2, ShieldCheck, Clock, FileText } from 'lucide-react';

const AssessmentCertificateModal = ({ result, onClose }) => {
  if (!result) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(result.submittedAt || result.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const passStatus = result.percentage >= 50 ? 'PASSED / QUALIFIED' : 'EVALUATION COMPLETED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-2 border-[#e2bfb9] rounded-2xl w-full max-w-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        
        {/* Modal Top Controls (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-4 print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#800000]" />
            <h3 className="font-extrabold text-base text-[#311213]">Official Evaluation Certificate & Report</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#8e706c] hover:text-[#311213] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE & SCORECARD BODY */}
        <div id="certificate-print-area" className="bg-[#fff8f7] border-4 border-[#800000]/20 rounded-2xl p-8 space-y-6 relative overflow-hidden print:border-2 print:border-[#800000]">
          
          {/* Decorative Corner Seals */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#800000]/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#800000]/5 rounded-full pointer-events-none" />

          {/* Certificate Header */}
          <div className="text-center space-y-3 border-b-2 border-[#e2bfb9] pb-6">
            <img
              src="/logo.png"
              alt="Forge India Connect"
              className="w-16 h-16 rounded-full mx-auto border-2 border-[#e2bfb9] object-cover shadow-sm"
            />
            <div>
              <h1 className="text-xs font-black text-[#800000] tracking-widest uppercase">FORGE INDIA CONNECT</h1>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#311213] tracking-wide mt-1">
                Certificate of Evaluation
              </h2>
              <p className="text-xs text-[#8e706c] font-semibold mt-0.5">
                Official Candidate Assessment Scorecard & Record
              </p>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="text-center space-y-2 py-2">
            <p className="text-xs text-[#8e706c] uppercase font-bold tracking-wider">This is to certify that</p>
            <h3 className="text-2xl font-extrabold text-[#800000] tracking-wide underline decoration-[#e2bfb9] underline-offset-4">
              {result.candidate?.name || 'Candidate'}
            </h3>
            <p className="text-xs text-[#5a413d] font-medium max-w-lg mx-auto leading-relaxed pt-1">
              has successfully completed the online proctored technical evaluation for the position track:
            </p>
            <p className="text-base font-extrabold text-[#311213] uppercase tracking-wider">
              "{result.job?.name || 'Technical Track'}"
            </p>
          </div>

          {/* Scorecard Metrics Box */}
          <div className="bg-white border-2 border-[#e2bfb9] rounded-xl p-5 grid grid-cols-3 gap-4 text-center shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-[#8e706c] uppercase block mb-1">Assessment Score</span>
              <span className="text-2xl font-black text-[#800000]">
                {result.score} <span className="text-xs font-normal text-[#8e706c]">/ {result.totalQuestions}</span>
              </span>
            </div>

            <div className="border-x border-[#ffe9e8]">
              <span className="text-[10px] font-bold text-[#8e706c] uppercase block mb-1">Percentage Score</span>
              <span className="text-2xl font-black text-[#800000]">
                {result.percentage}%
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#8e706c] uppercase block mb-1">Evaluation Outcome</span>
              <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                result.percentage >= 75
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : result.percentage >= 50
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}>
                {passStatus}
              </span>
            </div>
          </div>

          {/* Footer & Verification Code */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#ffe9e8] text-xs">
            <div className="flex items-center space-x-2 text-[#8e706c]">
              <ShieldCheck className="w-4 h-4 text-[#800000]" />
              <span className="font-mono text-[11px]">Token ID: {result.token || result._id}</span>
            </div>

            <div className="text-center sm:text-right">
              <p className="font-bold text-[#311213]">Date Issued: {formattedDate}</p>
              <p className="text-[10px] text-[#8e706c] font-semibold">Forge India Connect Verification System</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AssessmentCertificateModal;

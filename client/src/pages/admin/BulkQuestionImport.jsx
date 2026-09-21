import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Upload, 
  Loader2,
  Sparkles
} from 'lucide-react';

const BulkQuestionImport = () => {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [rawText, setRawText] = useState('');

  const [previewResult, setPreviewResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await API.get('/jobs');
        const activeJobs = res.data || [];
        setJobs(activeJobs);
        if (!selectedJobId && activeJobs.length > 0) {
          setSelectedJobId(activeJobs[0]._id);
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
      }
    };
    fetchJobs();
  }, []);

  const sampleFormat = `Question 1: What is recruitment?

A. The process of hiring employees
B. Employee termination
C. Payroll calculation
D. Performance review

Answer: A
Difficulty: Easy
Explanation: Recruitment attracts qualified applicants for job openings.

Question 2: What is employee retention?

A. Firing non-performers
B. Strategies to keep productive employees
C. Salary deduction
D. Job delegation

Answer: B
Difficulty: Medium
Explanation: Retention reduces costly turnover rates.`;

  const handleInsertSample = () => {
    setRawText(sampleFormat);
    setPreviewResult(null);
    setError('');
  };

  const handlePreview = async () => {
    setError('');
    setPreviewResult(null);

    if (!selectedJobId) {
      setError('Please select a target job position');
      return;
    }

    if (!rawText.trim()) {
      setError('Please paste question content into the text field');
      return;
    }

    setLoading(true);

    try {
      const res = await API.post('/questions/bulk', {
        jobId: selectedJobId,
        rawText,
        previewOnly: true
      });
      setPreviewResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse questions text');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setError('');

    if (!selectedJobId || !rawText.trim()) {
      setError('Job position and question text are required');
      return;
    }

    setImporting(true);

    try {
      const res = await API.post('/questions/bulk', {
        jobId: selectedJobId,
        rawText,
        previewOnly: false
      });

      setSuccessMsg(res.data.message || 'Questions imported successfully!');
      setTimeout(() => {
        navigate(`/admin/questions?jobId=${selectedJobId}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import questions');
    } finally {
      setImporting(false);
    }
  };

  const selectedJob = jobs.find(j => j._id === selectedJobId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/questions"
            className="p-2 text-[#5a413d] hover:text-[#800000] bg-[#fff0f0] hover:bg-[#ffe1e1] border border-[#e2bfb9] rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#311213]">Bulk Question Import</h1>
            <p className="text-sm text-[#8e706c] font-medium">Copy & paste up to 50+ MCQs from text/word documents into job question bank</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center space-x-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg} Redirecting to question bank...</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-300 text-[#800000] px-4 py-3 rounded-xl text-sm flex items-center space-x-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration & Input Card */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Job Selection */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ffe9e8] pb-5">
          <div className="w-full sm:w-80">
            <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-2">
              Select Target Job Position *
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setPreviewResult(null);
              }}
              className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-4 py-2.5 text-sm text-[#311213] font-semibold focus:outline-none focus:border-[#800000]"
            >
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.name} ({j.questionCount || 0} existing MCQs)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleInsertSample}
              className="flex items-center space-x-1.5 text-xs text-[#800000] hover:bg-[#ffe1e1] bg-[#fff0f0] border border-[#e2bfb9] px-3.5 py-2 rounded-xl transition-all font-bold shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Format</span>
            </button>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider">
              Paste Bulk Raw Questions Text
            </label>
            <span className="text-xs text-[#8e706c] font-medium">Format: Question &rarr; Options (A,B,C,D) &rarr; Answer: X</span>
          </div>
          <textarea
            rows={12}
            placeholder={`Question 1: What is recruitment?\n\nA. Option A\nB. Option B\nC. Option C\nD. Option D\n\nAnswer: B\nDifficulty: Easy\nExplanation: ...`}
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setPreviewResult(null);
            }}
            className="w-full bg-white border-2 border-[#e2bfb9] rounded-xl p-4 text-sm text-[#311213] placeholder:text-[#5a413d] placeholder:opacity-80 font-mono font-semibold leading-relaxed focus:outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20 transition-all shadow-inner"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading || !rawText.trim()}
            className="flex items-center space-x-2 bg-white hover:bg-[#fff0f0] text-[#311213] disabled:opacity-50 text-sm font-semibold px-5 py-2.5 rounded-xl border border-[#e2bfb9] transition-all shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#800000]" />
                <span>Parsing...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-[#800000]" />
                <span>Preview Validation</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !rawText.trim() || (previewResult && previewResult.validCount === 0)}
            className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Import Valid Questions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Report Card */}
      {previewResult && (
        <div className="bg-white border border-[#e2bfb9] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-4">
            <h3 className="text-base font-bold text-[#311213]">Import Preview & Validation Summary</h3>
            <div className="flex items-center space-x-3 text-xs font-bold">
              <span className="bg-[#ffe9e8] border border-[#e2bfb9] text-[#5a413d] px-3 py-1 rounded-full">
                {previewResult.totalCount} Total Parsed
              </span>
              <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full">
                {previewResult.validCount} Valid
              </span>
              <span className="bg-rose-50 border border-rose-300 text-rose-800 px-3 py-1 rounded-full">
                {previewResult.invalidCount} Invalid
              </span>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {previewResult.parsedItems.map((item) => (
              <div
                key={item.questionNumber}
                className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                  item.isValid
                    ? 'bg-[#fff8f7] border-[#e2bfb9] text-[#311213]'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#311213]">Question #{item.questionNumber}</span>
                  {item.isValid ? (
                    <span className="flex items-center text-emerald-700 font-bold space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid (Ans: {item.correctAnswer} • {item.difficulty || 'Medium'})</span>
                    </span>
                  ) : (
                    <span className="flex items-center text-rose-700 font-bold space-x-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Invalid Format</span>
                    </span>
                  )}
                </div>

                <p className="font-semibold text-[#311213]">{item.question || '(No question text parsed)'}</p>

                {item.errors && item.errors.length > 0 && (
                  <ul className="list-disc list-inside text-rose-700 text-[11px] font-semibold space-y-0.5 pt-1">
                    {item.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};

export default BulkQuestionImport;

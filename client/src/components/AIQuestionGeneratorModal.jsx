import React, { useState } from 'react';
import API from '../services/api';
import { Sparkles, X, Loader2, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

const AIQuestionGeneratorModal = ({ jobId, jobName, onClose, onGenerated }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic || !topic.trim()) {
      setError('Please enter a topic or prompt instructions for AI generation.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await API.post('/questions/ai-generate', {
        topic: topic.trim(),
        count: parseInt(count, 10),
        difficulty,
        jobId,
        autoSave: true
      });

      setSuccessMsg(res.data.message || 'AI successfully generated questions.');
      setPreviewQuestions(res.data.questions || []);

      if (onGenerated) {
        onGenerated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI questions');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-2 border-[#e2bfb9] rounded-2xl w-full max-w-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-br from-[#800000] to-rose-700 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#311213]">AI MCQ Question Generator</h3>
              <p className="text-xs text-[#8e706c] font-medium">
                Generating questions for position: <strong className="text-[#800000]">{jobName || 'Selected Job'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8e706c] hover:text-[#311213] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#311213] uppercase tracking-wider mb-1.5">
              Topic / Prompt Instructions
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Generate 5 intermediate UI/UX questions on wireframing, user research, and accessibility..."
              className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl p-3.5 text-xs text-[#311213] focus:outline-none focus:border-[#800000] font-medium placeholder-[#a38783]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#311213] uppercase tracking-wider mb-1.5">
                Number of Questions
              </label>
              <select
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl p-3 text-xs text-[#311213] font-semibold focus:outline-none focus:border-[#800000]"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#311213] uppercase tracking-wider mb-1.5">
                Target Difficulty Tier
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl p-3 text-xs text-[#311213] font-semibold focus:outline-none focus:border-[#800000]"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-300 text-[#800000] p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={generating}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#800000] to-rose-800 hover:from-[#570000] hover:to-rose-900 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 text-xs"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating AI Questions & Rationales...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate & Import into Question Bank</span>
              </>
            )}
          </button>
        </form>

        {/* Generated Questions Preview */}
        {previewQuestions.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-[#ffe9e8]">
            <h4 className="text-xs font-bold text-[#311213] uppercase tracking-wider">
              Generated Questions Preview ({previewQuestions.length})
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {previewQuestions.map((q, idx) => (
                <div key={idx} className="bg-[#fff8f7] border border-[#e2bfb9] p-3.5 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#311213]">
                    <span>{idx + 1}. {q.question}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${
                      q.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                      q.difficulty === 'Hard' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8e706c] font-semibold">
                    Ans: <strong className="text-[#800000]">Option {q.correctAnswer}</strong> • Rationale: {q.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIQuestionGeneratorModal;

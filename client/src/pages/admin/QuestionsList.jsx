import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../../services/api';
import { 
  HelpCircle, 
  Plus, 
  FileSpreadsheet, 
  Edit2, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  X,
  AlertCircle,
  Filter
} from 'lucide-react';

const QuestionsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Single Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [formData, setFormData] = useState({
    jobId: '',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    difficulty: 'Medium',
    explanation: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Jobs list
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

  // Fetch questions whenever selectedJobId changes
  const fetchQuestions = async (jobId) => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await API.get(`/jobs/${jobId}/questions`);
      setQuestions(res.data || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      setSearchParams({ jobId: selectedJobId });
      fetchQuestions(selectedJobId);
    }
  }, [selectedJobId]);

  const handleJobChange = (e) => {
    setSelectedJobId(e.target.value);
  };

  const openAddModal = () => {
    setEditingQuestionId(null);
    setFormData({
      jobId: selectedJobId,
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      difficulty: 'Medium',
      explanation: ''
    });
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (q) => {
    setEditingQuestionId(q._id);
    setFormData({
      jobId: q.jobId._id || q.jobId,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty || 'Medium',
      explanation: q.explanation || ''
    });
    setModalError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.question.trim() || !formData.optionA.trim() || !formData.optionB.trim() || !formData.optionC.trim() || !formData.optionD.trim()) {
      setModalError('Question text and all 4 options are required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingQuestionId) {
        await API.put(`/questions/${editingQuestionId}`, formData);
        setSuccessMsg('Question updated successfully');
      } else {
        await API.post('/questions', formData);
        setSuccessMsg('Question added successfully');
      }
      setShowModal(false);
      fetchQuestions(selectedJobId);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await API.delete(`/questions/${qId}`);
      setSuccessMsg('Question deleted successfully');
      fetchQuestions(selectedJobId);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const selectedJob = jobs.find(j => j._id === selectedJobId);

  const filteredQuestions = questions.filter(q => {
    if (difficultyFilter === 'All') return true;
    return (q.difficulty || 'Medium') === difficultyFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#311213]">Question Bank Management</h1>
          <p className="text-sm text-[#8e706c] mt-1 font-medium">Manage MCQs, difficulty tiers, explanations, and AI prompt generation</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/admin/questions/bulk?jobId=${selectedJobId}`}
            className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Import</span>
          </Link>
          <button
            onClick={openAddModal}
            disabled={!selectedJobId}
            className="flex items-center space-x-2 bg-white hover:bg-[#fff0f0] text-[#311213] border border-[#e2bfb9] text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#800000]" />
            <span>Add Single Question</span>
          </button>
        </div>
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {/* Filter Toolbar & Difficulty Pills */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1 max-w-md">
            <label className="text-xs font-bold text-[#8e706c] uppercase tracking-wider shrink-0">
              Select Job Position:
            </label>
            <select
              value={selectedJobId}
              onChange={handleJobChange}
              className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-4 py-2.5 text-sm text-[#311213] font-semibold focus:outline-none focus:border-[#800000] transition-colors"
            >
              {jobs.length === 0 && <option value="">No jobs available</option>}
              {jobs.map(j => (
                <option key={j._id} value={j._id}>
                  {j.name} ({j.questionCount || 0} Questions)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#8e706c]" />
            <span className="text-xs font-bold text-[#8e706c] uppercase mr-1">Difficulty:</span>
            {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  difficultyFilter === diff
                    ? 'bg-[#800000] text-white border-[#800000]'
                    : 'bg-[#fff8f7] text-[#5a413d] border-[#e2bfb9] hover:bg-[#fff0f0]'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-[#800000] animate-spin" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white border border-[#e2bfb9] rounded-2xl p-12 text-center shadow-sm">
          <HelpCircle className="w-12 h-12 text-[#8e706c] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#311213]">No questions found matching criteria</h3>
          <p className="text-sm text-[#8e706c] mt-1">Import 50+ questions via Bulk Import or add individual questions.</p>
          <div className="flex items-center justify-center space-x-3 mt-6">
            <Link
              to={`/admin/questions/bulk?jobId=${selectedJobId}`}
              className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bulk Import MCQs</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div key={q._id} className="bg-white border border-[#e2bfb9] rounded-2xl p-6 hover:border-[#800000] transition-all shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <span className="bg-[#ffe9e8] text-[#800000] border border-[#e2bfb9] font-extrabold px-2.5 py-1 rounded-lg text-xs shrink-0 mt-0.5">
                    Q{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                        q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        Difficulty: {q.difficulty || 'Medium'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#311213] leading-relaxed">{q.question}</h3>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-2 text-[#5a413d] hover:text-[#800000] bg-[#fff0f0] hover:bg-[#ffe1e1] border border-[#e2bfb9] rounded-lg transition-colors cursor-pointer"
                    title="Edit Question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="p-2 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                {['A', 'B', 'C', 'D'].map(optKey => {
                  const isCorrect = q.correctAnswer === optKey;
                  const optVal = q[`option${optKey}`];
                  return (
                    <div
                      key={optKey}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                          : 'bg-[#fff8f7] border-[#e2bfb9] text-[#5a413d]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-[#e2bfb9] text-[#5a413d]'
                        }`}>
                          {optKey}
                        </span>
                        <span className="truncate">{optVal}</span>
                      </div>
                      {isCorrect && (
                        <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider shrink-0 ml-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct Choice</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rationale / Explanation Box */}
              {q.explanation && (
                <div className="ml-9 p-3 bg-[#fff8f7] border border-[#e2bfb9] rounded-xl text-xs text-[#5a413d] font-medium">
                  <span className="font-bold text-[#800000] block mb-0.5">Answer Rationale & Explanation:</span>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#311213]/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#e2bfb9] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-4">
              <h3 className="text-lg font-bold text-[#311213]">
                {editingQuestionId ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#8e706c] hover:text-[#311213] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {modalError && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-rose-800 text-xs flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-1.5">
                    Target Job Position
                  </label>
                  <select
                    value={formData.jobId}
                    onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                    className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-3.5 py-2.5 text-sm text-[#311213] font-semibold focus:outline-none focus:border-[#800000]"
                  >
                    {jobs.map(j => (
                      <option key={j._id} value={j._id}>{j.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#311213] focus:outline-none focus:border-[#800000]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-1.5">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the question statement..."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-3.5 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt}>
                    <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-1">
                      Option {opt} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Choice ${opt}`}
                      value={formData[`option${opt}`]}
                      onChange={(e) => setFormData({ ...formData, [`option${opt}`]: e.target.value })}
                      className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-3.5 py-2 text-sm text-[#311213] focus:outline-none focus:border-[#800000]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-1.5">
                  Correct Answer Choice *
                </label>
                <select
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-3.5 py-2.5 text-sm font-bold text-emerald-800 focus:outline-none focus:border-[#800000]"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e706c] uppercase tracking-wider mb-1.5">
                  Detailed Explanation / Rationale (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why the correct answer is right for candidate feedback..."
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-3.5 py-2 text-xs text-[#311213] focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#ffe9e8]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#e2bfb9] text-[#5a413d] hover:bg-[#fff0f0] text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#800000] hover:bg-[#570000] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center space-x-2 shadow-sm cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingQuestionId ? 'Update Question' : 'Save Question'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsList;

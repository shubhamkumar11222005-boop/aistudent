import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  Award, 
  BarChart2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  History,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { 
  fetchDocuments, 
  generateQuiz, 
  fetchQuiz, 
  submitQuiz, 
  fetchQuizzesList 
} from '../services/api';

export function QuizPage({ initialDocId = null, onNavigate }) {
  // Navigation & View Mode: 'setup', 'taking', 'results', 'history'
  const [viewMode, setViewMode] = useState('setup');

  // Documents & Selection state
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || '');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);

  // Active Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: selectedOptionString }

  // Results state
  const [quizResults, setQuizResults] = useState(null);

  // Past Quizzes list
  const [quizzesList, setQuizzesList] = useState([]);

  // Loading and Error states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);

  // Load documents and quiz list on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update selected doc if prop changes
  useEffect(() => {
    if (initialDocId) {
      setSelectedDocId(initialDocId);
    }
  }, [initialDocId]);

  const loadInitialData = async () => {
    try {
      const [docsData, listData] = await Promise.all([
        fetchDocuments().catch(() => []),
        fetchQuizzesList().catch(() => [])
      ]);

      const docList = Array.isArray(docsData) ? docsData : (docsData.documents || []);
      setDocuments(docList);
      setQuizzesList(listData);

      if (docList.length > 0 && !selectedDocId) {
        setSelectedDocId(docList[0].id);
      }
    } catch (err) {
      console.error("Failed to load quiz initial data", err);
    }
  };

  // 1. Generate Quiz Handler
  const handleGenerateQuiz = async (e) => {
    e?.preventDefault();
    if (!selectedDocId) {
      setErrorMessage("Please select a study document to generate the quiz from.");
      return;
    }

    const doc = documents.find(d => d.id === Number(selectedDocId));
    if (doc && doc.page_count === 0) {
      setErrorMessage("The selected document appears to be empty. Please choose a document with lecture notes or study content.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setWarningMessage(null);

    try {
      const generatedQuiz = await generateQuiz(selectedDocId, numQuestions, difficulty);
      
      if (!generatedQuiz.questions || generatedQuiz.questions.length === 0) {
        throw new Error("No questions were generated. The document may not contain enough readable academic text.");
      }

      setActiveQuiz(generatedQuiz);
      setUserAnswers({});
      setCurrentQuestionIdx(0);
      setViewMode('taking');
      // Refresh quizzes list in background
      fetchQuizzesList().then(setQuizzesList).catch(() => {});
    } catch (err) {
      console.error("Quiz generation failed:", err);
      setErrorMessage(
        err.message || "Failed to generate quiz. Please check that the document has extracted text or try with fewer questions."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Select an option for current question
  const handleSelectOption = (questionId, option) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  // 3. Submit Quiz
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    // Check if any questions are unanswered
    const totalQ = activeQuiz.questions.length;
    const answeredCount = Object.keys(userAnswers).length;

    if (answeredCount < totalQ) {
      const confirmed = window.confirm(
        `You have answered ${answeredCount} of ${totalQ} questions. Are you sure you want to submit? Unanswered questions will be scored as incorrect.`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const results = await submitQuiz(activeQuiz.id, userAnswers);
      setQuizResults(results);
      setViewMode('results');
      // Refresh quizzes list
      fetchQuizzesList().then(setQuizzesList).catch(() => {});
    } catch (err) {
      console.error("Quiz submission error:", err);
      setErrorMessage(err.message || "Failed to submit quiz. Please try submitting again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Resume or Retake an existing quiz from history
  const handleTakeExistingQuiz = async (quizId) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const quiz = await fetchQuiz(quizId);
      setActiveQuiz(quiz);
      setUserAnswers({});
      setCurrentQuestionIdx(0);
      setViewMode('taking');
    } catch (err) {
      setErrorMessage("Could not load selected quiz. Please try generating a new one.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to create another quiz
  const handleStartNewQuiz = () => {
    setActiveQuiz(null);
    setQuizResults(null);
    setUserAnswers({});
    setViewMode('setup');
  };

  const selectedDocument = documents.find(d => d.id === Number(selectedDocId));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Quiz Generator</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Multiple Choice & Assessment
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Generate grounded multiple-choice questions from your course documents, test your knowledge, and review in-depth explanations.
          </p>
        </div>

        {/* Header Action Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            id="quiz-tab-setup"
            onClick={() => setViewMode('setup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'setup'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Quiz
          </button>
          <button
            id="quiz-tab-history"
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Quiz History ({quizzesList.length})</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <strong className="font-semibold text-rose-200">Attention:</strong> {errorMessage}
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-rose-400 hover:text-rose-200 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: QUIZ SETUP */}
      {viewMode === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Setup Form Card */}
          <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Configure New Quiz</h2>
              <p className="text-sm text-slate-400 mt-1">
                Select your study source material, set your desired difficulty level, and StudyAI will synthesize custom practice questions.
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-800/40 border border-dashed border-slate-700 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-medium text-slate-200">No Documents Uploaded</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  To generate an AI quiz, you first need to upload a lecture PDF or textbook chapter.
                </p>
                <button
                  id="quiz-goto-documents-btn"
                  onClick={() => onNavigate && onNavigate('documents')}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
                >
                  Upload Documents Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateQuiz} className="space-y-6">
                {/* 1. Document Selection */}
                <div className="space-y-2">
                  <label htmlFor="quiz-doc-select" className="block text-sm font-medium text-slate-200">
                    1. Select Study Document
                  </label>
                  <select
                    id="quiz-doc-select"
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {documents.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.original_filename} ({doc.page_count} pages • {(doc.file_size / 1024).toFixed(1)} KB)
                      </option>
                    ))}
                  </select>

                  {selectedDocument && (
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-slate-300">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        {selectedDocument.original_filename}
                      </span>
                      <span>•</span>
                      <span>{selectedDocument.page_count} page(s)</span>
                      <span>•</span>
                      <span className="text-emerald-400">Processed into chunks</span>
                    </div>
                  )}
                </div>

                {/* 2. Difficulty Level */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    2. Select Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { 
                        level: 'Easy', 
                        desc: 'Definitions & direct recall', 
                        badge: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' 
                      },
                      { 
                        level: 'Medium', 
                        desc: 'Concepts & relationships', 
                        badge: 'text-amber-400 border-amber-500/20 bg-amber-500/10' 
                      },
                      { 
                        level: 'Hard', 
                        desc: 'Synthesis & analysis', 
                        badge: 'text-rose-400 border-rose-500/20 bg-rose-500/10' 
                      }
                    ].map(item => (
                      <button
                        key={item.level}
                        type="button"
                        id={`quiz-diff-${item.level.toLowerCase()}`}
                        onClick={() => setDifficulty(item.level)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          difficulty === item.level
                            ? 'border-indigo-500 bg-indigo-950/40 shadow-sm shadow-indigo-500/10'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">{item.level}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badge}`}>
                            {item.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Number of Questions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-200">
                      3. Number of Questions
                    </label>
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {numQuestions} questions
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {[3, 5, 8, 10].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNumQuestions(val)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                          numQuestions === val
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {val} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  id="quiz-generate-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Synthesizing Multiple Choice Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Quiz ({numQuestions} Questions)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Side Info & Recent Quizzes Card */}
          <div className="space-y-6">
            {/* Quick Overview Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Assessment Standards
              </h3>
              <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Zero Hallucination:</strong> Questions are extracted strictly from your document's text and definitions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Hidden Answers:</strong> Solutions and explanations are locked until final submission.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Detailed Feedback:</strong> Get instant percentage scores with educational explanations for every question.</span>
                </li>
              </ul>
            </div>

            {/* Recent Quizzes Available */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-violet-400" />
                  Existing Quizzes
                </h3>
                <span className="text-xs text-slate-400">{quizzesList.length} total</span>
              </div>

              {quizzesList.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No quizzes created yet. Generate your first one above!</p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {quizzesList.slice(0, 5).map(q => (
                    <div 
                      key={q.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-200 truncate">{q.title}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{q.number_of_questions} Qs</span>
                          <span>•</span>
                          <span className={
                            q.difficulty === 'Easy' ? 'text-emerald-400' :
                            q.difficulty === 'Hard' ? 'text-rose-400' : 'text-amber-400'
                          }>{q.difficulty}</span>
                          {q.best_percentage !== null && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-400 font-medium">Best: {q.best_percentage}%</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleTakeExistingQuiz(q.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium transition-all flex-shrink-0"
                      >
                        Take
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: QUIZ TAKING INTERFACE */}
      {viewMode === 'taking' && activeQuiz && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quiz Top Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  activeQuiz.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  activeQuiz.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {activeQuiz.difficulty} Difficulty
                </span>
                <span className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                  Source: {activeQuiz.document_name}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{activeQuiz.title}</h2>
            </div>

            {/* Answered progress pill */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Progress</div>
                <div className="text-sm font-bold text-indigo-400">
                  {Object.keys(userAnswers).length} of {activeQuiz.questions.length} answered
                </div>
              </div>
              <button
                onClick={handleStartNewQuiz}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800"
              >
                Quit Quiz
              </button>
            </div>
          </div>

          {/* Question Navigation Tracker */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {activeQuiz.questions.map((q, idx) => {
              const isAnswered = Boolean(userAnswers[q.id]);
              const isCurrent = idx === currentQuestionIdx;
              return (
                <button
                  key={q.id}
                  id={`quiz-nav-q-${idx + 1}`}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all flex items-center justify-center flex-shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Active Question Card */}
          {(() => {
            const currentQ = activeQuiz.questions[currentQuestionIdx];
            if (!currentQ) return null;
            const currentAnswer = userAnswers[currentQ.id];

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
                {/* Question Header & Progress */}
                <div className="space-y-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-white text-sm">
                      Question {currentQuestionIdx + 1} / {activeQuiz.questions.length}
                    </span>
                    <span className="text-slate-400">
                      {Math.round(((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100)}% complete
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Statement */}
                <h3 className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed whitespace-pre-line pt-2">
                  {currentQ.question}
                </h3>


                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = currentAnswer === opt;
                    const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                    return (
                      <div
                        key={optIdx}
                        id={`question-${currentQ.id}-opt-${letter}`}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 select-none ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 shadow-md shadow-indigo-500/10'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/50'
                        }`}
                      >
                        {/* Option Letter Indicator */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {letter}
                        </div>

                        {/* Option Text */}
                        <div className="flex-1 text-sm sm:text-base text-slate-200 leading-snug pt-0.5">
                          {opt}
                        </div>

                        {/* Radio Checkmark */}
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : 'border-slate-700'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Question Navigation Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-800 gap-3">
                  <button
                    id="btn-quiz-prev"
                    onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="text-xs text-slate-400 hidden sm:block">
                    {currentAnswer ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Option selected
                      </span>
                    ) : (
                      <span className="text-slate-500">Unanswered</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {currentQuestionIdx < activeQuiz.questions.length - 1 ? (
                      <button
                        id="btn-quiz-next"
                        onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : null}

                    <button
                      id="quiz-final-submit-btn"
                      onClick={handleSubmitQuiz}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Scoring Quiz...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Quiz</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* Quick Submit Footer Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Finished answering all questions? Submit anytime to grade your answers.
            </div>
            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Submit Quiz ({Object.keys(userAnswers).length}/{activeQuiz.questions.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: QUIZ RESULTS */}
      {viewMode === 'results' && quizResults && (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Score Header Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-teal-500/10 pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-2">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Quiz Evaluation Completed</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Here is your comprehensive score breakdown, correct answers, and educational explanations.
              </p>
            </div>

            {/* Score 4-Card Display */}
            {(() => {
              const correctCount = quizResults.results ? quizResults.results.filter(r => r.is_correct).length : quizResults.score;
              const incorrectCount = quizResults.results ? quizResults.results.filter(r => !r.is_correct).length : (quizResults.total_questions - quizResults.score);
              return (
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-2xl mx-auto">
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Score</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                      {quizResults.score} <span className="text-sm font-normal text-slate-400">/ {quizResults.total_questions}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Percentage</div>
                    <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                      quizResults.percentage >= 80 ? 'text-emerald-400' :
                      quizResults.percentage >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {quizResults.percentage}%
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Correct</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                      {correctCount}
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Incorrect</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1">
                      {incorrectCount}
                    </div>
                  </div>
                </div>
              );
            })()}


            {/* Action Buttons */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="quiz-retake-btn"
                onClick={() => activeQuiz && handleTakeExistingQuiz(activeQuiz.id)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span>Retake This Quiz</span>
              </button>

              <button
                id="quiz-new-btn"
                onClick={handleStartNewQuiz}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Another Quiz</span>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('chat', activeQuiz?.document_id)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <span>Ask AI About This Topic</span>
              </button>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Question Analysis & Explanations
              </h3>
              <span className="text-xs text-slate-400">
                {quizResults.results.filter(r => r.is_correct).length} correct • {quizResults.results.filter(r => !r.is_correct).length} incorrect
              </span>
            </div>

            <div className="space-y-4">
              {quizResults.results.map((item, idx) => (
                <div
                  key={item.question_id || idx}
                  className={`p-6 rounded-2xl border transition-all ${
                    item.is_correct
                      ? 'bg-slate-900/60 border-emerald-500/30'
                      : 'bg-slate-900/60 border-rose-500/30'
                  }`}
                >
                  {/* Status header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 uppercase">
                        Question {idx + 1}
                      </span>
                      {item.is_correct ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          Incorrect
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question */}
                  <h4 className="text-base font-semibold text-slate-100 mt-3 mb-4 leading-relaxed">
                    {item.question}
                  </h4>

                  {/* Options review */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {item.options.map((opt, optIdx) => {
                      const isChosen = item.selected_answer === opt;
                      const isCorrect = item.correct_answer === opt;

                      let style = "bg-slate-950 border-slate-800 text-slate-300";
                      if (isCorrect) {
                        style = "bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold";
                      } else if (isChosen && !isCorrect) {
                        style = "bg-rose-950/40 border-rose-500 text-rose-200 line-through";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${style}`}
                        >
                          <span className="font-bold flex-shrink-0">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                          {isChosen && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Callout */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1">
                    <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Explanation:
                    </div>
                    <p className="text-slate-300 leading-relaxed pl-5">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: QUIZ HISTORY */}
      {viewMode === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Generated Quizzes Archive</h2>
              <p className="text-xs text-slate-400">Review, take, or retake all quizzes created from your documents.</p>
            </div>
            <button
              onClick={() => setViewMode('setup')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create New Quiz</span>
            </button>
          </div>

          {quizzesList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <History className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No Quizzes Recorded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate your first quiz from any document to start building your quiz archive.
              </p>
              <button
                onClick={() => setViewMode('setup')}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium inline-block"
              >
                Go to Quiz Setup
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzesList.map(q => (
                <div
                  key={q.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        q.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{q.title}</h3>
                    <p className="text-xs text-slate-400 truncate">Source: {q.document_name}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      <div>{q.number_of_questions} Questions</div>
                      <div className="text-[11px] text-slate-500">
                        {q.attempts_count} attempt(s) {q.best_percentage !== null && `• Best: ${q.best_percentage}%`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleTakeExistingQuiz(q.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                    >
                      Start Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

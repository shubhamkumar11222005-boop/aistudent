import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  HelpCircle, 
  Award, 
  TrendingUp, 
  Activity, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  ArrowRight, 
  Upload, 
  RefreshCw,
  ChevronRight,
  Plus
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';

export function DashboardPage({ healthStatus, onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError("Unable to load study analytics. Please check that the backend service is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 18) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  const formatTimeAgo = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header with Requested Headline and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Continue learning and make progress today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            id="dash-btn-quick-upload"
            onClick={() => onNavigate('documents')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDashboardData} className="underline font-semibold ml-3 hover:text-white">
            Retry
          </button>
        </div>
      )}

      {/* 2. Stats Cards: Documents, Questions Asked, Quizzes Completed, Average Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Documents */}
        <div 
          onClick={() => onNavigate('documents')}
          className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Documents
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              analytics?.total_documents ?? 0
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Stored in SQLite</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
          </div>
        </div>

        {/* Card 2: Questions Asked */}
        <div 
          onClick={() => onNavigate('chat')}
          className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Questions Asked
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              analytics?.questions_asked ?? 0
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Grounded AI queries</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
          </div>
        </div>

        {/* Card 3: Quizzes Completed */}
        <div 
          onClick={() => onNavigate('quiz')}
          className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quizzes Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              analytics?.quizzes_completed ?? 0
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Graded student attempts</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
          </div>
        </div>

        {/* Card 4: Average Score */}
        <div 
          onClick={() => onNavigate('analytics')}
          className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded" />
            ) : (
              `${analytics?.average_quiz_score ?? 0}%`
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Overall quiz accuracy</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
          </div>
        </div>
      </div>

      {/* 3. Quick Actions: Upload Document, Ask AI, Generate Quiz */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Quick Action 1: Upload Document */}
          <div 
            id="dash-action-upload"
            onClick={() => onNavigate('documents')}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Upload Document
                </h3>
                <p className="text-xs text-slate-400">Import PDFs and extract lecture notes</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Quick Action 2: Ask AI */}
          <div 
            id="dash-action-ask-ai"
            onClick={() => onNavigate('chat')}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  Ask AI
                </h3>
                <p className="text-xs text-slate-400">Query your notes with citations</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Quick Action 3: Generate Quiz */}
          <div 
            id="dash-action-generate-quiz"
            onClick={() => onNavigate('quiz')}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                  Generate Quiz
                </h3>
                <p className="text-xs text-slate-400">Practice questions with explanations</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* 4. Two Column Layout: Recently Uploaded Documents + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Uploaded Documents Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Recently Uploaded Documents</h2>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View all ({analytics?.total_documents || 0}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-slate-800/40 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (!analytics?.recently_uploaded_documents || analytics.recently_uploaded_documents.length === 0) ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-medium text-slate-300">No documents uploaded yet</p>
              <p className="text-[11px] text-slate-500">Upload a PDF lecture or syllabus to begin.</p>
              <button
                onClick={() => onNavigate('documents')}
                className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {analytics.recently_uploaded_documents.map(doc => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {doc.original_filename}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{doc.page_count} page(s)</span>
                      <span>•</span>
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{formatTimeAgo(doc.upload_date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onNavigate('chat', doc.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      title="Chat with document"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => onNavigate('quiz', doc.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium transition-colors"
                      title="Generate quiz from document"
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-slate-800/40 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (!analytics?.recent_activity || analytics.recent_activity.length === 0) ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <Activity className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-medium text-slate-300">No activity recorded yet</p>
              <p className="text-[11px] text-slate-500">
                Ask a question in AI Chat or complete a practice quiz to see your timeline.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {analytics.recent_activity.slice(0, 5).map(act => {
                const isQuiz = act.type === 'quiz_completed';
                const isChat = act.type === 'chat_question';

                return (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isQuiz ? 'bg-indigo-500/10 text-indigo-400' :
                        isChat ? 'bg-violet-500/10 text-violet-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {isQuiz && <Award className="w-4 h-4" />}
                        {isChat && <MessageSquare className="w-4 h-4" />}
                        {!isQuiz && !isChat && <FileText className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

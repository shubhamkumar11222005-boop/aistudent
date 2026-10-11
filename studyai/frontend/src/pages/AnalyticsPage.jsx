import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  HelpCircle, 
  Award, 
  TrendingUp, 
  Clock, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles,
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';

export function AnalyticsPage({ onNavigate }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Failed to fetch study analytics. Please check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Study Analytics</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Database Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time assessment metrics, question engagement, and performance analytics calculated from your SQLite database.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* 1. Core 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Documents Uploaded */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documents Uploaded</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {isLoading ? "..." : analyticsData?.total_documents ?? 0}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span>Stored in SQLite with chunks</span>
          </div>
        </div>

        {/* Metric 2: Questions Asked */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Questions Asked</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {isLoading ? "..." : analyticsData?.questions_asked ?? 0}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span>Grounded AI Chat queries</span>
          </div>
        </div>

        {/* Metric 3: Quizzes Completed */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quizzes Completed</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {isLoading ? "..." : analyticsData?.quizzes_completed ?? 0}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span>Graded student attempts</span>
          </div>
        </div>

        {/* Metric 4: Average Quiz Score */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Quiz Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {isLoading ? "..." : `${analyticsData?.average_quiz_score ?? 0}%`}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span>Across all recorded submissions</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Performance Breakdown & Score Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance by Difficulty */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Performance by Difficulty
            </h3>
            <span className="text-[11px] text-slate-500">Database avg</span>
          </div>

          <div className="space-y-4">
            {[
              { 
                key: 'Easy', 
                label: 'Easy Tier', 
                color: 'bg-emerald-500', 
                text: 'text-emerald-400', 
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20'
              },
              { 
                key: 'Medium', 
                label: 'Medium Tier', 
                color: 'bg-amber-500', 
                text: 'text-amber-400', 
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20'
              },
              { 
                key: 'Hard', 
                label: 'Hard Tier', 
                color: 'bg-rose-500', 
                text: 'text-rose-400', 
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/20'
              }
            ].map(diff => {
              const stat = analyticsData?.performance_by_difficulty?.[diff.key] || { attempts_count: 0, average_percentage: 0 };
              const pct = stat.average_percentage || 0;

              return (
                <div key={diff.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{diff.label}</span>
                    <span className="text-slate-400">
                      <strong className={`font-bold ${diff.text}`}>{pct}%</strong> avg ({stat.attempts_count} attempts)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full ${diff.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Adaptive difficulty grading</span>
            <button
              onClick={() => onNavigate && onNavigate('quiz')}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Take Quiz <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Score Progression Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Score Progression Timeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Chronological record of recent quiz attempt scores</p>
            </div>
            <span className="text-xs text-slate-500">
              {analyticsData?.score_trend?.length || 0} recent attempts
            </span>
          </div>

          {(!analyticsData?.score_trend || analyticsData.score_trend.length === 0) ? (
            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-center p-4">
              <Award className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-400">No quiz attempts recorded yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Complete a quiz in Quiz Generator to plot your learning curve!</p>
              <button
                onClick={() => onNavigate && onNavigate('quiz')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
              >
                Start Practice Quiz
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Visual Bar chart */}
              <div className="h-40 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800 overflow-x-auto">
                {analyticsData.score_trend.map((item, idx) => (
                  <div key={idx} className="flex-1 min-w-[42px] flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.percentage}%
                    </span>
                    <div 
                      className={`w-full rounded-t-lg transition-all ${
                        item.percentage >= 80 ? 'bg-emerald-500 hover:bg-emerald-400' :
                        item.percentage >= 60 ? 'bg-amber-500 hover:bg-amber-400' :
                        'bg-rose-500 hover:bg-rose-400'
                      }`}
                      style={{ height: `${Math.max(15, (item.percentage / 100) * 110)}px` }}
                    />
                    <span className="text-[10px] text-slate-500 truncate w-full text-center">
                      #{item.attempt_id}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Earliest attempt</span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> &gt;=80%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> 60-79%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;60%
                  </span>
                </span>
                <span>Latest attempt</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Recent Activity Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              Recent Study Activity Feed
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit trail of document uploads, AI chat queries, and quiz completions
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {analyticsData?.recent_activity?.length || 0} recent events
          </span>
        </div>

        {(!analyticsData?.recent_activity || analyticsData.recent_activity.length === 0) ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500">No activity recorded yet in the database.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {analyticsData.recent_activity.map((act) => {
              const isQuiz = act.type === 'quiz_completed';
              const isChat = act.type === 'chat_question';
              const isDoc = act.type === 'document_uploaded';

              return (
                <div key={act.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-1 last:pb-1">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isQuiz ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      isChat ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {isQuiz && <Award className="w-4 h-4" />}
                      {isChat && <MessageSquare className="w-4 h-4" />}
                      {isDoc && <FileText className="w-4 h-4" />}
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

                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

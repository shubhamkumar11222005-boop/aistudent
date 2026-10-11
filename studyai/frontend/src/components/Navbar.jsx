import React from 'react';
import { BookOpen, Activity, LayoutDashboard, Layers, Terminal, FileText, Bot } from 'lucide-react';

export function Navbar({ currentRoute, onNavigate, healthStatus }) {
  const isOnline = healthStatus?.success;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold transition-transform group-hover:scale-105">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">StudyAI</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Step 3 AI Chat (RAG)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">AI-Powered Study Assistant</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            id="nav-btn-landing"
            onClick={() => onNavigate('landing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentRoute === 'landing'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Overview</span>
          </button>

          <button
            id="nav-btn-documents"
            onClick={() => onNavigate('documents')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentRoute === 'documents'
                ? 'bg-indigo-600 text-white border border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </button>

          <button
            id="nav-btn-chat"
            onClick={() => onNavigate('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentRoute === 'chat'
                ? 'bg-indigo-600 text-white border border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">AI Chat</span>
          </button>

          <button
            id="nav-btn-dashboard"
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentRoute === 'dashboard'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Workspace</span>
          </button>

          <button
            id="nav-btn-architecture"
            onClick={() => onNavigate('architecture')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentRoute === 'architecture'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden lg:inline">Architecture</span>
          </button>
        </nav>

        {/* Health status badge */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onNavigate('architecture')}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            }`}
            title="Click to view API Health & Diagnostics"
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono">API: {isOnline ? 'ONLINE' : 'CONNECTING'}</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { 
  Terminal, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Server, 
  Layout, 
  Sparkles,
  BookMarked,
  FileText,
  UploadCloud
} from 'lucide-react';
import { PROJECT_METADATA } from '../utils/constants';

export function LandingPage({ onNavigate, healthStatus }) {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-8 sm:p-12">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Step 2: Document Management &amp; Database Layer</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            StudyAI — <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200">AI-Powered Study Assistant</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            A production-ready full-stack educational assistant engineered with a decoupled FastAPI backend, React + Vite frontend, PyPDF text extraction, and SQLite/SQLAlchemy ORM document persistence.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              id="hero-documents-btn"
              onClick={() => onNavigate('documents')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Open My Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-dashboard-btn"
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <span>Workspace Dashboard</span>
            </button>

            <button
              id="hero-arch-btn"
              onClick={() => onNavigate('architecture')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 transition-all"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>API Diagnostics</span>
            </button>
          </div>
        </div>

        {/* Live System Badge */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-500">Backend API</div>
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${healthStatus?.success ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              FastAPI (Port 8000)
            </div>
          </div>
          <div>
            <div className="text-slate-500">Frontend Client</div>
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              React + Vite (Port 5173/3000)
            </div>
          </div>
          <div>
            <div className="text-slate-500">Database Engine</div>
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              SQLite + SQLAlchemy ORM
            </div>
          </div>
          <div>
            <div className="text-slate-500">Health Endpoint</div>
            <div className="font-mono text-emerald-400 mt-1 font-semibold">
              GET /api/health (200 OK)
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Architecture */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <Layout className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Modern React Frontend</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Built with React 19, Vite, Tailwind CSS, and Lucide icons. Features organized directory structure with layouts, pages, hooks, and services.
          </p>
          <div className="font-mono text-xs text-indigo-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
            frontend/src/components, pages, services
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">FastAPI Backend</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Lightweight, asynchronous Python web framework providing structured modular routing, dependency injection, and standardized JSON responses.
          </p>
          <div className="font-mono text-xs text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
            backend/app/main.py, routes, schemas
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">SQLAlchemy & SQLite</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Relational persistence layer defining Users, StudySessions, and Notes tables with session lifecycle management.
          </p>
          <div className="font-mono text-xs text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
            backend/app/database, models/study.py
          </div>
        </div>
      </section>

      {/* 6-Step Project Roadmap */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">6-Step Project Build Roadmap</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Building progressively according to strict engineering milestone discipline.
            </p>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4" />
            <span>Step 1 Active & Complete</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECT_METADATA.roadmap.map((item) => (
            <div 
              key={item.step}
              className={`p-4 rounded-xl border transition-colors ${
                item.status === 'completed'
                  ? 'bg-slate-900/90 border-emerald-500/30 text-white'
                  : 'bg-slate-950/50 border-slate-800/70 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  item.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  Step {item.step}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  item.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.status === 'completed' ? 'Done' : 'Upcoming'}
                </span>
              </div>
              <h4 className={`text-sm font-semibold mb-1 ${item.status === 'completed' ? 'text-white' : 'text-slate-300'}`}>
                {item.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

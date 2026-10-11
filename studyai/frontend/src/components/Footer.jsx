import React from 'react';
import { Terminal, Database, Server, Cpu, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">StudyAI Assistant</span>
          <span>•</span>
          <span>AI Chat RAG & Practice Quiz Engine</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Gemini 3.6 Flash
          </span>
          <span className="flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-emerald-400" /> FastAPI
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-amber-400" /> SQLite ORM
          </span>
        </div>

        <div>
          <span className="font-mono text-[11px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-300">
            Step 4 Complete
          </span>
        </div>
      </div>
    </footer>
  );
}


import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  Database, 
  Layers, 
  CheckCircle2, 
  Activity, 
  RefreshCw, 
  Server, 
  ShieldCheck, 
  FileText, 
  Sliders,
  Terminal
} from 'lucide-react';
import { fetchChatStatus, checkBackendHealth } from '../services/api';

export function SettingsPage({ healthStatus, onNavigate }) {
  const [aiStatus, setAiStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  useEffect(() => {
    fetchChatStatus().then(setAiStatus).catch(() => {});
  }, []);

  const handleTestLatency = async () => {
    setIsTesting(true);
    try {
      const res = await checkBackendHealth();
      setPingResult(res);
    } catch (err) {
      setPingResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Architecture</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Configuration
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage StudyAI runtime parameters, examine AI grounding models, and inspect SQLite ORM persistence layers.
          </p>
        </div>

        <button
          onClick={handleTestLatency}
          disabled={isTesting}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Activity className={`w-3.5 h-3.5 text-indigo-400 ${isTesting ? 'animate-spin' : ''}`} />
          <span>Ping API Backend</span>
        </button>
      </div>

      {/* Ping Result Banner */}
      {pingResult && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          pingResult.success
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Backend responded with <strong>{pingResult.status}</strong> ({pingResult.application}) in <strong>{pingResult.latencyMs}ms</strong>.
            </span>
          </div>
          <button onClick={() => setPingResult(null)} className="text-slate-400 hover:text-white font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. AI & LLM Engine Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              AI Intelligence Engine
            </h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              aiStatus?.has_api_key
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
            }`}>
              {aiStatus?.has_api_key ? 'Live AI Mode' : 'Grounded Demo Mode'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Foundation Model</span>
              <span className="font-semibold text-slate-200">{aiStatus?.model || 'gemini-3.6-flash'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">API Key Status</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {aiStatus?.has_api_key ? 'Configured & Active' : 'Fallback Active'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Retrieval Grounding Strategy</span>
              <span className="font-semibold text-slate-300">TF-ICF + Phrase Matching</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Strict Hallucination Policy</span>
              <span className="font-semibold text-indigo-400">Zero-Hallucination Guardrail</span>
            </div>
          </div>
        </div>

        {/* 2. Database & ORM Storage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              SQLite Database & ORM
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Connected
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Database Engine</span>
              <span className="font-semibold text-slate-200">SQLite 3 (Local persistent file)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">ORM Framework</span>
              <span className="font-semibold text-slate-200">SQLAlchemy 2.0 (Declarative Base)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Schema Models</span>
              <span className="font-semibold text-slate-300">Document, Chunk, Quiz, Attempt</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Cascading Deletes</span>
              <span className="font-semibold text-emerald-400">ON DELETE CASCADE Enabled</span>
            </div>
          </div>
        </div>

        {/* 3. Document Chunking Pipeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              Document Processing Pipeline
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              PyPDF + Sliding Window
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Chunk Window Size</span>
              <span className="font-semibold text-slate-200">600 characters</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Window Overlap</span>
              <span className="font-semibold text-slate-200">100 characters</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Boundary Awareness</span>
              <span className="font-semibold text-slate-300">Paragraph & Period Snapping</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Page Mapping</span>
              <span className="font-semibold text-emerald-400">Preserved on each chunk</span>
            </div>
          </div>
        </div>

        {/* 4. Full-Stack Routing & Host */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              Network & Proxy Topology
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Port 3000 Ingress
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">External Gateway</span>
              <span className="font-semibold text-slate-200">0.0.0.0:3000 (Vite Reverse Proxy)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Internal FastAPI Backend</span>
              <span className="font-semibold text-slate-200">127.0.0.1:8001 (Uvicorn ASGI)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Frontend Client</span>
              <span className="font-semibold text-slate-300">React 19, Tailwind CSS v4, Lucide</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">CORS Policy</span>
              <span className="font-semibold text-emerald-400">Full Origin Whitelist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

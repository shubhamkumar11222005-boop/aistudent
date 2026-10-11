import React from 'react';
import { Bot, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';

export function AskAiNoticeModal({ document, onClose }) {
  if (!document) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        id="ask-ai-notice-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Bot className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Roadmap Step 4 Preview
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            AI Study Assistant
          </h3>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            You selected <strong className="text-white font-medium">"{document.original_filename}"</strong>.
          </p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The document text ({document.page_count} pages) has already been parsed and saved to SQLite. 
            Direct LLM Q&amp;A, flashcard generation, and study summarization will be wired up in <strong>Step 4: LLM AI Engine Integration</strong>.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Document extracted text is ready for contextual prompting</span>
          </div>
          <p className="text-slate-400 pl-6 text-[11px]">
            Characters extracted: {document.extracted_text ? document.extracted_text.length.toLocaleString() : (document.text_preview ? 'Available' : 'Pending')}
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            Got it, continue
          </button>
        </div>
      </div>
    </div>
  );
}

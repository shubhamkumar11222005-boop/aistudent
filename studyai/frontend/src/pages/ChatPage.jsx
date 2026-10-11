import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Layers, 
  BookOpen, 
  Trash2, 
  Info, 
  CheckCircle2, 
  Cpu,
  Library,
  SlidersHorizontal,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  fetchDocuments, 
  chatWithDocument, 
  fetchChatStatus,
  fetchChatHistory,
  clearChatHistory 
} from '../services/api';

const MULTI_DOC_SUGGESTIONS = [
  "Summarize key concepts across all my uploaded PDFs",
  "Compare the main topics between my course materials",
  "What are the most important exam topics in these documents?",
  "Explain discrete-time signals and systems",
  "What biological processes are covered in my notes?",
  "Create revision notes synthesizing my materials"
];

const SINGLE_DOC_SUGGESTIONS = [
  "Summarize this document",
  "Explain the difficult concepts with examples",
  "What are the key formulas or definitions?",
  "What are the most important exam questions from this?",
  "Create quick revision bullet points"
];

export function ChatPage({ initialDocId, onNavigate }) {
  const [documents, setDocuments] = useState([]);
  // 'all' represents common chat across all uploaded documents
  const [selectedScope, setSelectedScope] = useState(() => {
    if (initialDocId && initialDocId !== 'all') {
      return String(initialDocId);
    }
    return 'all';
  });
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatus, setChatStatus] = useState({ demo_mode: true, has_api_key: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const [loadingStep, setLoadingStep] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load documents and unified chat history on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [docs, status, history] = await Promise.all([
        fetchDocuments().catch(() => []),
        fetchChatStatus().catch(() => ({ demo_mode: true, has_api_key: false })),
        fetchChatHistory('all').catch(() => [])
      ]);

      setDocuments(docs);
      setChatStatus(status);

      // Load unified conversation history
      if (history && history.length > 0) {
        const loaded = [];
        history.forEach((h) => {
          if (h.question) {
            loaded.push({
              id: `hist-q-${h.id}`,
              sender: 'user',
              text: h.question,
              scopeName: h.document_name || (h.document_id ? `Document #${h.document_id}` : 'All Documents'),
              timestamp: h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
            });
          }
          if (h.answer) {
            loaded.push({
              id: `hist-a-${h.id}`,
              sender: 'ai',
              text: h.answer,
              sources: h.sources || [],
              demoMode: true,
              documentName: h.document_name || 'All Documents',
              timestamp: h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
            });
          }
        });
        setMessages(loaded);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const isAllDocs = selectedScope === 'all';
  const selectedDocument = !isAllDocs ? documents.find(d => String(d.id) === String(selectedScope)) : null;

  const currentScopeDisplayName = isAllDocs 
    ? `All Documents (${documents.length} PDFs)` 
    : (selectedDocument?.original_filename || 'Selected Document');

  const totalChunksCount = documents.reduce((acc, d) => acc + (d.chunks_count || 1), 0);

  // Send question using the unified RAG endpoint
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setError(null);
    setInputQuery('');

    const targetScopeId = selectedScope;
    const scopeLabel = isAllDocs ? `All Documents (${documents.length} PDFs)` : (selectedDocument?.original_filename || 'Document');

    const userMessageId = Date.now().toString();
    const newUserMsg = {
      id: userMessageId,
      sender: 'user',
      text: query,
      scopeName: scopeLabel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    setLoadingStep(isAllDocs ? 'Searching knowledge base across all PDFs...' : 'Retrieving relevant sections from document...');

    const timer = setTimeout(() => {
      setLoadingStep('Synthesizing grounded multi-source answer...');
    }, 700);

    try {
      const result = await chatWithDocument(targetScopeId, query);
      clearTimeout(timer);

      const aiMessageId = (Date.now() + 1).toString();
      const newAiMsg = {
        id: aiMessageId,
        sender: 'ai',
        text: result.answer,
        sources: result.sources || [],
        demoMode: result.demo_mode,
        documentName: result.document_name || scopeLabel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newAiMsg]);
    } catch (err) {
      clearTimeout(timer);
      setError(err.message || 'Failed to generate answer. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleSources = (msgId) => {
    setExpandedSources(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleClearChat = async () => {
    try {
      await clearChatHistory('all');
      setMessages([]);
      setError(null);
      setConfirmClear(false);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
      setMessages([]);
      setConfirmClear(false);
    }
  };

  // Helper to get distinct document color badge for source citations
  const getDocBadgeColor = (docName = '') => {
    const lower = docName.toLowerCase();
    if (lower.includes('bio')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (lower.includes('signal') || lower.includes('dsp')) return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto">
      {/* Header Bar: Scope Selector & RAG Engine Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>StudyAI Assistant</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
                Multi-PDF RAG
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Unified question answering grounded across all uploaded study documents
            </p>
          </div>
        </div>

        {/* Scope Selector Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {documents.length > 0 ? (
            <div className="relative">
              <select
                id="scope-selector"
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                disabled={isLoading}
                className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl pl-8 pr-8 py-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 max-w-[240px] sm:max-w-[280px] truncate shadow-sm"
              >
                <option value="all">
                  📚 All Documents ({documents.length} PDFs)
                </option>
                {documents.map((doc) => (
                  <option key={doc.id} value={String(doc.id)}>
                    📄 {doc.original_filename} ({doc.page_count}p)
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <button
              onClick={() => onNavigate && onNavigate('documents')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload PDF First</span>
            </button>
          )}

          {/* Mode Indicator Badge */}
          <button
            onClick={() => setShowStatusModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              chatStatus.demo_mode
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/30'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30'
            }`}
            title="Click to view Multi-Document RAG pipeline details"
          >
            {chatStatus.demo_mode ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Mode</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Gemini</span>
              </>
            )}
            <Info className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Jump to Practice Quiz */}
          <button
            onClick={() => onNavigate && onNavigate('quiz', selectedScope !== 'all' ? selectedScope : (documents[0]?.id || null))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 transition-all shadow-sm"
            title="Generate a practice quiz from study materials"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Practice Quiz</span>
          </button>
        </div>
      </div>

      {/* Quick Scope Filter Chips (Seamless filter without clearing messages) */}
      {documents.length > 1 && (
        <div className="flex items-center gap-1.5 pb-3 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Active Scope:
          </span>
          <button
            onClick={() => setSelectedScope('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              isAllDocs
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            <Library className="w-3 h-3" />
            <span>All Documents ({documents.length})</span>
          </button>
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedScope(String(doc.id))}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 truncate max-w-[200px] ${
                selectedScope === String(doc.id)
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
              }`}
              title={doc.original_filename}
            >
              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{doc.original_filename}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Chat Container */}
      <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-inner">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {documents.length === 0 ? (
            /* No documents state */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400">
                <FileText className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-semibold text-white">No Study Materials Uploaded</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Please upload course PDFs in the "My Documents" section. StudyAI will extract the text, build chunk indices, and ground your answers across all uploaded files.
                </p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('documents')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                <BookOpen className="w-4 h-4" />
                <span>Go to My Documents</span>
              </button>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State with Multi-Document Suggested Prompts */
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-6">
              <div className="space-y-3 max-w-lg">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Multi-Document RAG Knowledge Base
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask questions across <span className="text-indigo-300 font-medium">all {documents.length} uploaded PDFs</span> in this single chat. You can compare topics, request cross-document summaries, or inquire about specific concepts.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                    📚 {documents.length} Uploaded PDFs
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                    🧩 {totalChunksCount} Indexed Chunks
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    🔍 Cross-Document TF-ICF Grounding
                  </span>
                </div>
              </div>

              {/* Suggested Questions Grid */}
              <div className="w-full max-w-xl space-y-2 pt-2">
                <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Suggested Questions ({isAllDocs ? 'Across All Documents' : 'For Selected Document'})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {(isAllDocs ? MULTI_DOC_SUGGESTIONS : SINGLE_DOC_SUGGESTIONS).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isLoading}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-indigo-500/50 text-xs text-slate-200 transition-all text-left group flex items-start justify-between gap-2 shadow-sm"
                    >
                      <span className="group-hover:text-indigo-200 transition-colors leading-relaxed">{q}</span>
                      <Send className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Conversation Messages */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1 shadow-inner">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/80 shadow-sm'
                  }`}
                >
                  {/* Sender Header & Scope Tag */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[11px] opacity-80">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {msg.sender === 'user' ? 'You' : 'StudyAI RAG Engine'}
                      </span>
                      {msg.scopeName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/90 font-mono">
                          {msg.scopeName}
                        </span>
                      )}
                      {msg.sender === 'ai' && msg.documentName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                          {msg.documentName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="hover:text-white transition-colors"
                          title="Copy answer"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  {msg.sender === 'user' ? (
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed prose prose-invert max-w-none text-slate-200">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h3 className="text-base font-bold text-white mt-3 mb-1.5" {...props} />,
                          h2: ({node, ...props}) => <h4 className="text-sm font-bold text-indigo-200 mt-2.5 mb-1" {...props} />,
                          h3: ({node, ...props}) => <h5 className="text-xs font-bold text-indigo-300 mt-2 mb-1" {...props} />,
                          h4: ({node, ...props}) => <h6 className="text-xs font-semibold text-cyan-300 mt-2 mb-1" {...props} />,
                          p: ({node, ...props}) => <p className="text-xs sm:text-sm text-slate-300 mb-2 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1 text-xs sm:text-sm text-slate-300" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-xs sm:text-sm text-slate-300" {...props} />,
                          li: ({node, ...props}) => <li className="text-xs sm:text-sm text-slate-300" {...props} />,
                          blockquote: ({node, ...props}) => (
                            <blockquote className="border-l-2 border-indigo-500 pl-3 italic text-xs text-indigo-200/90 my-2 bg-indigo-950/20 py-1.5 rounded-r" {...props} />
                          ),
                          strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                          code: ({node, ...props}) => (
                            <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-300 font-mono text-xs" {...props} />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Grounded Multi-Document Citations Accordion */}
                  {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-700/60">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className="flex items-center justify-between w-full text-left text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>
                            Grounded Citations ({msg.sources.length} chunks across {Array.from(new Set(msg.sources.map(s => s.document_name || 'Document'))).length} PDF{Array.from(new Set(msg.sources.map(s => s.document_name || 'Document'))).length !== 1 ? 's' : ''})
                          </span>
                        </span>
                        {expandedSources[msg.id] ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="mt-2.5 space-y-2">
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 text-[11px] text-slate-300 space-y-1.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getDocBadgeColor(src.document_name)}`}>
                                    📄 {src.document_name || 'Uploaded PDF'}
                                  </span>
                                  <span className="text-slate-400 text-[10px] font-mono">
                                    Page {src.page_number} • Chunk #{src.chunk_index + 1}
                                  </span>
                                </div>
                                {src.relevance_score != null && (
                                  <span className="text-[10px] font-mono text-emerald-400">
                                    Relevance: {Math.round(src.relevance_score * 100)}%
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {src.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1 shadow-inner">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-800/90 border border-slate-700 text-xs text-slate-300 flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-indigo-300 font-medium">{loadingStep || 'Searching knowledge base...'}</span>
              </div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 border border-rose-500/30 text-[11px] font-medium"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills (when conversation is active) */}
        {messages.length > 0 && !isLoading && (
          <div className="px-3 sm:px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 mr-1">Prompts:</span>
            {(isAllDocs ? MULTI_DOC_SUGGESTIONS : SINGLE_DOC_SUGGESTIONS).slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <div className="relative">
                {confirmClear ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleClearChat}
                      className="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                      title="Confirm clear all chat history"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700/60"
                    title="Clear common chat history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                id="chat-input"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  documents.length === 0
                    ? 'Upload a PDF to ask questions...'
                    : isAllDocs
                    ? `Ask anything across all ${documents.length} PDFs (e.g. Compare concepts or summarize topics)...`
                    : `Ask a question about ${selectedDocument?.original_filename || 'this document'}...`
                }
                disabled={documents.length === 0 || isLoading}
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isLoading || documents.length === 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
            <span>
              Querying: <strong className="text-slate-400">{currentScopeDisplayName}</strong>
            </span>
            <span className="hidden sm:inline">
              Press <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">Enter</kbd> to send
            </span>
          </div>
        </div>
      </div>

      {/* RAG Architecture / Status Modal */}
      {showStatusModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowStatusModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Multi-Document RAG Architecture</h3>
                  <p className="text-xs text-slate-400">Integrated Knowledge Base &amp; Grounding Pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-indigo-300 uppercase tracking-wider text-[10px]">
                  Knowledge Base Index
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Uploaded Documents:</span>
                    <span className="font-bold text-white">{documents.length} PDFs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Chunks In Memory:</span>
                    <span className="font-bold text-white">{totalChunksCount} Chunks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Query Scope:</span>
                    <span className="font-bold text-indigo-400">{currentScopeDisplayName}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-emerald-300 uppercase tracking-wider text-[10px]">
                  Retrieval &amp; Grounding Strategy
                </div>
                <div className="space-y-1 text-slate-400 leading-relaxed text-[11px]">
                  <p>• <strong>TF-ICF + Multi-Document BM25:</strong> Extracts keywords, calculates inverse chunk frequency, and boosts document title occurrences.</p>
                  <p>• <strong>Cross-Document Diversity:</strong> Ensures queries spanning multiple topics retrieve relevant chunks across different PDFs.</p>
                  <p>• <strong>Chunk Window:</strong> Sliding window of 600 characters with 100 character overlap, preserving paragraph boundaries.</p>
                  <p>• <strong>Model:</strong> {chatStatus.demo_mode ? 'Grounded Deterministic Engine (Zero Hallucination)' : 'Gemini 3.8 Flash'}.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

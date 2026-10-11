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
  HelpCircle,
  Cpu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  fetchDocuments, 
  chatWithDocument, 
  fetchChatStatus,
  fetchDocumentChunks,
  fetchChatHistory 
} from '../services/api';

const SUGGESTED_QUESTIONS = [
  "Summarize this document",
  "Explain the difficult concepts",
  "What are the important exam topics?",
  "Create revision notes",
  "Explain this in simple language"
];

export function ChatPage({ initialDocId, onNavigate }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatus, setChatStatus] = useState({ demo_mode: true, has_api_key: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const [loadingStep, setLoadingStep] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load documents and chat status on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [docs, status] = await Promise.all([
        fetchDocuments().catch(() => []),
        fetchChatStatus().catch(() => ({ demo_mode: true, has_api_key: false }))
      ]);

      setDocuments(docs);
      setChatStatus(status);

      // Set initial selected document
      if (docs.length > 0) {
        if (initialDocId && docs.some(d => d.id === Number(initialDocId))) {
          setSelectedDocId(Number(initialDocId));
        } else {
          setSelectedDocId(docs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const selectedDocument = documents.find(d => d.id === Number(selectedDocId));

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load conversation history whenever selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) {
      setMessages([]);
      return;
    }
    let isCurrent = true;
    fetchChatHistory(selectedDocId)
      .then((history) => {
        if (!isCurrent) return;
        if (history && history.length > 0) {
          const loadedMessages = [];
          history.forEach((h) => {
            if (h.question) {
              loadedMessages.push({
                id: `hist-q-${h.id}`,
                sender: 'user',
                text: h.question,
                timestamp: h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
              });
            }
            if (h.answer) {
              loadedMessages.push({
                id: `hist-a-${h.id}`,
                sender: 'ai',
                text: h.answer,
                sources: h.sources || [],
                demoMode: true,
                documentName: selectedDocument?.original_filename,
                timestamp: h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
              });
            }
          });
          setMessages(loadedMessages);
        } else {
          setMessages([]);
        }
      })
      .catch((err) => {
        console.warn('Could not load chat history:', err);
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedDocId, selectedDocument?.original_filename]);

  // Reset conversation when document changes
  const handleDocumentChange = (e) => {
    const newDocId = Number(e.target.value);
    setSelectedDocId(newDocId);
    setError(null);
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || !selectedDocId || isLoading) return;

    setError(null);
    setInputQuery('');

    const userMessageId = Date.now().toString();
    const newUserMsg = {
      id: userMessageId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    setLoadingStep('Retrieving relevant chunks...');

    // Progress simulation for responsive UX
    const timer = setTimeout(() => {
      setLoadingStep('Synthesizing grounded answer...');
    }, 600);

    try {
      const result = await chatWithDocument(selectedDocId, query);
      clearTimeout(timer);

      const aiMessageId = (Date.now() + 1).toString();
      const newAiMsg = {
        id: aiMessageId,
        sender: 'ai',
        text: result.answer,
        sources: result.sources || [],
        demoMode: result.demo_mode,
        documentName: result.document_name,
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

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto">
      {/* Header Bar: Document Selector & Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>StudyAI Assistant</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
                RAG Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Retrieval-Augmented Study Q&amp;A directly grounded in your uploaded documents
            </p>
          </div>
        </div>

        {/* Document Selector & Demo Mode Badge */}
        <div className="flex items-center gap-2.5">
          {documents.length > 0 ? (
            <div className="relative">
              <select
                id="document-selector"
                value={selectedDocId || ''}
                onChange={handleDocumentChange}
                disabled={isLoading}
                className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-8 py-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 max-w-[220px] sm:max-w-[260px] truncate"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.original_filename} ({doc.page_count}p)
                  </option>
                ))}
              </select>
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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

          {/* Demo Mode / Live Mode Indicator */}
          <button
            onClick={() => setShowStatusModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              chatStatus.demo_mode
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/30'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30'
            }`}
            title="Click to view RAG architecture & runtime configuration"
          >
            {chatStatus.demo_mode ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Mode</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live AI (Gemini)</span>
              </>
            )}
            <Info className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Jump to Quiz for this document */}
          {selectedDocId && (
            <button
              onClick={() => onNavigate && onNavigate('quiz', selectedDocId)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 transition-all shadow-sm"
              title="Generate a practice quiz from this document"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Practice Quiz</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col overflow-hidden shadow-inner">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {documents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400">
                <FileText className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-semibold text-white">No Study Material Found</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Before asking questions, please upload a PDF document in the "My Documents" section. StudyAI will extract the text, split it into chunks, and ground all AI answers in your material.
                </p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('documents')}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                <BookOpen className="w-4 h-4" />
                <span>Go to My Documents</span>
              </button>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State with Suggested Questions */
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-6">
              <div className="space-y-3 max-w-lg">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Ready to study: <span className="text-indigo-300">{selectedDocument?.original_filename}</span>
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask any question about this document. StudyAI will locate the most relevant sections using vector/keyword chunk retrieval and formulate an answer strictly grounded in your text.
                </p>
                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
                  <span>📄 {selectedDocument?.page_count || 1} Pages</span>
                  <span>•</span>
                  <span>🧩 {selectedDocument?.chunks_count || 'Segmented'} Chunks</span>
                  <span>•</span>
                  <span>🔒 Zero Hallucination Mode</span>
                </div>
              </div>

              {/* Suggested Questions Grid */}
              <div className="w-full max-w-xl space-y-2 pt-2">
                <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Suggested Questions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isLoading}
                      className="p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-indigo-500/50 text-xs text-slate-200 transition-all text-left group flex items-start justify-between gap-2"
                    >
                      <span className="group-hover:text-indigo-200 transition-colors">{q}</span>
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
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/80 shadow-sm'
                  }`}
                >
                  {/* Sender Header & Actions */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/10 text-[11px] opacity-75">
                    <span className="font-medium">
                      {msg.sender === 'user' ? 'You' : 'StudyAI'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="hover:text-white transition-colors"
                          title="Copy message"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
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
                          p: ({node, ...props}) => <p className="text-xs sm:text-sm text-slate-300 mb-2 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1 text-xs sm:text-sm text-slate-300" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-xs sm:text-sm text-slate-300" {...props} />,
                          li: ({node, ...props}) => <li className="text-xs sm:text-sm text-slate-300" {...props} />,
                          blockquote: ({node, ...props}) => (
                            <blockquote className="border-l-2 border-indigo-500 pl-3 italic text-xs text-indigo-200/90 my-2 bg-indigo-950/20 py-1 rounded-r" {...props} />
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

                  {/* Grounded Sources Accordion (AI Messages only) */}
                  {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-700/60">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className="flex items-center justify-between w-full text-left text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Retrieved Grounding Sources ({msg.sources.length} chunks)</span>
                        </span>
                        {expandedSources[msg.id] ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="mt-2 space-y-2">
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-[11px] text-slate-300 space-y-1"
                            >
                              <div className="flex items-center justify-between font-mono text-[10px] text-indigo-300 border-b border-slate-800 pb-1">
                                <span>Chunk #{src.chunk_index + 1} • Page {src.page_number}</span>
                                {src.relevance_score != null && (
                                  <span className="text-slate-400">
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
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-800/90 border border-slate-700 text-xs text-slate-300 flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-indigo-300 font-medium">{loadingStep || 'Processing question...'}</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 border border-rose-500/30 text-[11px] font-medium"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills (when conversation is active) */}
        {selectedDocId && messages.length > 0 && !isLoading && (
          <div className="px-3 sm:px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 mr-1">Prompts:</span>
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q, idx) => (
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
              <button
                onClick={clearChat}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedDocument
                    ? `Ask a question about ${selectedDocument.original_filename}...`
                    : "Please select or upload a document first..."
                }
                disabled={!selectedDocId || isLoading}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || !selectedDocId || isLoading}
              className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>
              {chatStatus.demo_mode 
                ? "Pre-grounded RAG answers from document chunks" 
                : "Live AI Mode: Gemini Flash connected"}
            </span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </div>

      {/* RAG & Demo Mode Explainer Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">RAG Architecture &amp; Demo Mode</h3>
                  <p className="text-xs text-slate-400">Step 3 Milestone Status</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pipeline Architecture</span>
                </div>
                <p className="text-indigo-200/80 font-mono text-[11px]">
                  PDF ➔ pypdf Text Extract ➔ Sliding Window Chunking ➔ SQLite document_chunks ➔ Keyword/TF-ICF Retrieval ➔ LLM / Grounded Synthesis
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-white">How Demo Mode Works:</div>
                <p className="text-slate-400">
                  When no <code className="text-indigo-300">AI_API_KEY</code> or <code className="text-indigo-300">GEMINI_API_KEY</code> is configured in your environment, StudyAI activates **Demo Mode**. 
                  Instead of breaking or failing with an error, the system still runs the full chunking and retrieval pipeline, then generates a grounded summary, concept review, or specific answer directly from the retrieved document chunks!
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-white">Zero Hallucination Guardrail:</div>
                <p className="text-slate-400">
                  Both live LLM prompts and demo generation strictly enforce that questions on topics absent from the document are rejected with an explicit note, preventing fabricated answers.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

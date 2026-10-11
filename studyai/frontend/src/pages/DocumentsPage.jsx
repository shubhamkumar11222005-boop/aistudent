import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Bot, 
  Layers, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Eye, 
  X, 
  Loader2,
  Sparkles,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { 
  fetchDocuments, 
  uploadDocument, 
  deleteDocument 
} from '../services/api';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

export function DocumentsPage({ onNavigate }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const fileInputRef = useRef(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Detail viewing
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err.message || 'Failed to retrieve documents from SQLite database.');
    } finally {
      setLoading(false);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF document (.pdf).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB maximum limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFileName(file.name);
    setError(null);
    setSuccessMessage(null);

    try {
      const uploadedDoc = await uploadDocument(file, (progress) => {
        setUploadProgress(progress);
      });

      setSuccessMessage(`"${uploadedDoc.original_filename}" processed successfully (${uploadedDoc.page_count} pages, ${uploadedDoc.chunks_count || 1} chunks).`);
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Failed to upload and process document.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete document
  const handleDeleteConfirm = async () => {
    if (!confirmDeleteDoc) return;
    const docId = confirmDeleteDoc.id;
    const docName = confirmDeleteDoc.original_filename;
    setDeletingDocId(docId);
    setConfirmDeleteDoc(null);

    try {
      await deleteDocument(docId);
      setSuccessMessage(`Document "${docName}" has been removed.`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(`Failed to delete document: ${err.message}`);
    } finally {
      setDeletingDocId(null);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const filteredDocs = documents.filter((doc) => 
    doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Knowledge Base
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            My Documents
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload PDF textbooks, lecture slides, and notes. Extracted text is indexed into chunks for AI Chat and practice quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            id="btn-refresh-documents"
            onClick={loadDocuments}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh documents list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            id="btn-trigger-upload-top"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-sm disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,.pdf"
        className="hidden"
        id="pdf-file-input"
      />

      {/* Error Alert */}
      {error && (
        <div 
          id="documents-error-banner"
          className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start justify-between gap-3 text-rose-300 text-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Unable to complete request</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div 
          id="documents-success-banner"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start justify-between gap-3 text-emerald-300 text-sm"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">Operation Successful</p>
              <p className="text-xs text-emerald-300/90 mt-0.5">{successMessage}</p>
            </div>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        id="pdf-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-600'
        } ${isUploading ? 'pointer-events-none opacity-90' : ''}`}
      >
        {isUploading ? (
          <div className="max-w-md mx-auto space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {uploadProgress < 100 ? 'Uploading PDF Document...' : 'Processing Document...'}
              </p>
              <p className="text-xs text-slate-400 truncate max-w-xs mx-auto mt-1 font-mono">
                {uploadingFileName}
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${Math.max(uploadProgress, 8)}%` }}
              />
            </div>
            
            <p className="text-[11px] text-slate-400">
              {uploadProgress < 100 
                ? `${uploadProgress}% uploaded` 
                : 'Extracting text & creating chunks in SQLite...'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Drag and drop your study PDF here, or <span className="text-indigo-400 underline underline-offset-2">browse files</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF textbooks, lecture slides, and notes up to 25MB • PyPDF automated chunking
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Documents List & Search Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Stored Documents
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {documents.length}
            </span>
          </div>

          {/* Search bar */}
          {documents.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-documents"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter documents..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div 
                key={n} 
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-slate-800/40 rounded-xl" />
                <div className="flex justify-between pt-2 border-t border-slate-800/60">
                  <div className="h-8 bg-slate-800 rounded w-20" />
                  <div className="h-8 bg-slate-800 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && documents.length === 0 && (
          <div 
            id="empty-documents-state"
            className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-semibold text-white">No documents uploaded yet</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Upload your first lecture notes or textbook chapter above. StudyAI will extract the text and index chunks into SQLite for AI Chat and Quizzes.
              </p>
            </div>
            <button
              id="btn-empty-state-upload"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Your First PDF</span>
            </button>
          </div>
        )}

        {/* Filtered empty state */}
        {!loading && documents.length > 0 && filteredDocs.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs">
            No documents matching "{searchQuery}".
          </div>
        )}

        {/* Document Cards Grid */}
        {!loading && filteredDocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                id={`document-card-${doc.id}`}
                className="flex flex-col justify-between rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all p-5 shadow-sm"
              >
                {/* Card Header & Content */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 
                          className="text-sm font-semibold text-white truncate hover:text-indigo-300 transition-colors cursor-pointer"
                          title={doc.original_filename}
                          onClick={() => setSelectedDoc(doc)}
                        >
                          {doc.original_filename}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{doc.page_count} page{doc.page_count !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{formatBytes(doc.file_size)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      {doc.chunks_count || 1} chunks
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileCheck className="w-3 h-3" />
                      {doc.processing_status || 'Processed'}
                    </span>
                  </div>

                  {/* Text Preview Box */}
                  <div 
                    onClick={() => setSelectedDoc(doc)}
                    className="cursor-pointer bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    title="Click to view full extracted text"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Extracted Text Preview</span>
                      <span className="text-indigo-400 flex items-center gap-1 text-[11px]">
                        <Eye className="w-3 h-3" />
                        View
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-300 line-clamp-3 leading-relaxed">
                      {doc.text_preview || 'No text content preview available.'}
                    </p>
                  </div>

                  {/* Date & ID */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {formatDate(doc.upload_date)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ID #{doc.id}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons: Chat, Quiz, View, Delete */}
                <div className="flex items-center justify-between gap-1.5 pt-4 mt-4 border-t border-slate-800/80">
                  <button
                    id={`btn-ask-ai-${doc.id}`}
                    onClick={() => onNavigate && onNavigate('chat', doc.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
                    title="Ask AI questions about this document"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Chat</span>
                  </button>

                  <button
                    id={`btn-quiz-${doc.id}`}
                    onClick={() => onNavigate && onNavigate('quiz', doc.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-semibold transition-all"
                    title="Generate practice quiz from this document"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quiz</span>
                  </button>

                  <button
                    id={`btn-view-doc-${doc.id}`}
                    onClick={() => setSelectedDoc(doc)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="View full extracted text"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`btn-delete-doc-${doc.id}`}
                    onClick={() => setConfirmDeleteDoc(doc)}
                    disabled={deletingDocId === doc.id}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors disabled:opacity-50"
                    title="Delete document"
                  >
                    {deletingDocId === doc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Document Deletion */}
      {confirmDeleteDoc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setConfirmDeleteDoc(null)}
        >
          <div 
            id="confirm-delete-modal"
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Delete Document?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-white">"{confirmDeleteDoc.original_filename}"</strong>?
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                This will delete the file and all extracted chunks from SQLite.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                id="btn-cancel-delete"
                onClick={() => setConfirmDeleteDoc(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

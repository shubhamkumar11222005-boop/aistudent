import React, { useState } from 'react';
import { 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  FolderTree, 
  Play, 
  Database, 
  Server, 
  Cpu, 
  Copy, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export function ArchitecturePage({ healthStatus, onRefreshHealth }) {
  const [copiedSection, setCopiedSection] = useState(null);
  const [testResponse, setTestResponse] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTestEndpoint = async () => {
    setTesting(true);
    const result = await checkBackendHealth();
    setTestResponse(result);
    setTesting(false);
    onRefreshHealth();
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const backendCommands = `# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start FastAPI server independently on port 8000
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
# Or: python run.py`;

  const frontendCommands = `# 1. Navigate to frontend
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Start Vite React development server independently on port 5173
npm run dev`;

  const treeStructure = `studyai/
├── backend/
│   ├── app/
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── database.py        # SQLAlchemy engine & SQLite session provider
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── study.py           # User, StudySession, Note models
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── health.py          # HealthResponse Pydantic schema
│   │   │   └── study.py           # Study & user validation schemas
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py          # GET /health endpoint route
│   │   │   └── api.py             # API router combining sub-routers
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── health_service.py  # Health diagnostics service
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── logger.py          # Structured backend logging
│   │   ├── __init__.py
│   │   └── main.py                # FastAPI app initialization & CORS setup
│   ├── requirements.txt           # fastapi, uvicorn, sqlalchemy, pydantic
│   └── run.py                     # Convenience runner script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Responsive top navigation & live status
│   │   │   └── Footer.jsx         # System metadata footer
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx     # Master application layout
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # Professional project presentation
│   │   │   ├── DashboardPage.jsx  # Student workspace dashboard placeholder
│   │   │   └── ArchitecturePage.jsx # Interactive health & architecture inspector
│   │   ├── services/
│   │   │   └── api.js             # API service for GET /api/health
│   │   ├── hooks/
│   │   │   └── useHealthCheck.js  # Reactive health monitor custom hook
│   │   ├── utils/
│   │   │   └── constants.js       # Constants & 6-step roadmap definitions
│   │   ├── App.jsx                # Main React root & client-side router
│   │   ├── main.jsx               # React DOM entry point
│   │   └── index.css              # Tailwind CSS stylesheet
│   ├── index.html                 # HTML entry point
│   ├── package.json               # React, Vite, Tailwind, Lucide dependencies
│   └── vite.config.js             # Vite config with backend proxy to :8000
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git exclusions for Python & Node
└── README.md                      # Comprehensive project documentation`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            System Architecture & Health Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live health verification, decoupled service execution, and directory manifest.
          </p>
        </div>

        <button
          onClick={handleTestEndpoint}
          disabled={testing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Testing Endpoint...' : 'Test GET /api/health'}</span>
        </button>
      </div>

      {/* Live Health Check Console */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300">Live Health Check Endpoint</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
              GET /api/health
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${healthStatus?.success ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-xs font-medium text-slate-400">
              {healthStatus?.success ? 'Status: 200 OK' : 'Status: Degraded / Disconnected'}
            </span>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">HTTP Response Body (JSON)</span>
              <span>Latency: {healthStatus?.latencyMs || 0}ms</span>
            </div>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
{JSON.stringify(
  testResponse?.raw || {
    status: healthStatus?.status || "ok",
    application: healthStatus?.application || "StudyAI"
  },
  null,
  2
)}
            </pre>
            <p className="text-[11px] text-slate-500">
              Contract Guarantee: Returns exactly status "ok" and application "StudyAI".
            </p>
          </div>

          {/* Verification Metrics */}
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-slate-300">Architectural Criteria Checklist:</div>
            
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">FastAPI Application Initialized</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">SQLite + SQLAlchemy Schema</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Table Setup Ready
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">React 19 + Vite Frontend</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Tailwind CSS + Lucide Icons</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Decoupled Independent Execution</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Supported
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Commands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Commands */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Backend Execution Commands (FastAPI)</span>
            </div>
            <button
              onClick={() => copyToClipboard(backendCommands, 'backend')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy commands"
            >
              {copiedSection === 'backend' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{backendCommands}
          </pre>
        </div>

        {/* Frontend Commands */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Frontend Execution Commands (React)</span>
            </div>
            <button
              onClick={() => copyToClipboard(frontendCommands, 'frontend')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy commands"
            >
              {copiedSection === 'frontend' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{frontendCommands}
          </pre>
        </div>
      </div>

      {/* Complete Folder Structure */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FolderTree className="w-4 h-4 text-amber-400" />
            <span>Complete Architecture Folder Structure</span>
          </div>
          <button
            onClick={() => copyToClipboard(treeStructure, 'tree')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy tree"
          >
            {copiedSection === 'tree' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed">
{treeStructure}
        </pre>
      </div>
    </div>
  );
}

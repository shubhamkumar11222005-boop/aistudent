import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  Sparkles, 
  BarChart3, 
  Settings, 
  BookOpen, 
  Menu, 
  X, 
  Activity, 
  ChevronRight,
  ShieldCheck,
  Cpu,
  User,
  LogOut,
  ExternalLink
} from 'lucide-react';

export function Sidebar({ currentRoute, onNavigate, healthStatus }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'documents',
      label: 'My Documents',
      icon: FileText,
      badge: null,
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: Bot,
      badge: 'RAG',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      id: 'quiz',
      label: 'Quiz Generator',
      icon: Sparkles,
      badge: 'Interactive',
      badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelect = (route) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  const isOnline = healthStatus?.success;

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md">
        <div 
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight">StudyAI</span>
            <span className="ml-1.5 text-[10px] font-medium text-slate-400">Assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">{isOnline ? 'Online' : 'Connecting'}</span>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="w-72 max-w-[80vw] h-full bg-slate-950 border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-lg text-white tracking-tight">StudyAI</span>
                </div>
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation List */}
              <nav className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-nav-${item.id}`}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
                          isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile User Profile Section */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div 
                onClick={() => handleSelect('settings')}
                className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-semibold text-xs">
                  AC
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">Alex Chen</p>
                  <p className="text-[10px] text-slate-400 truncate">alex.chen@university.edu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-slate-950 border-r border-slate-800/80">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
            <div 
              onClick={() => handleSelect('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-500 transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-white tracking-tight">StudyAI</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">AI Study Assistant</p>
              </div>
            </div>
          </div>

          {/* Main Nav Section */}
          <div className="flex-1 px-3 py-5 overflow-y-auto space-y-6">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
                Navigation
              </div>
              <nav className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none group ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${
                          isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Subtle Platform Feature Note */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>RAG Retrieval Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Answers and quizzes are grounded in your course materials without hallucinations.
              </p>
            </div>
          </div>

          {/* User / Profile Section at the Bottom */}
          <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950">
            {/* System Status Pill */}
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="font-medium text-slate-300">{isOnline ? 'Backend Online' : 'Connecting...'}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">StudyAI Core</span>
            </div>

            {/* Profile Card */}
            <div 
              id="sidebar-user-profile"
              onClick={() => handleSelect('settings')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-semibold text-xs">
                    AC
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    Alex Chen
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    alex.chen@university.edu
                  </div>
                </div>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

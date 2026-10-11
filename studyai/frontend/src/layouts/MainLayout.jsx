import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';

export function MainLayout({ children, currentRoute, onNavigate, healthStatus }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Persistent Sidebar on Desktop & Mobile Drawer */}
      <Sidebar 
        currentRoute={currentRoute} 
        onNavigate={onNavigate} 
        healthStatus={healthStatus} 
      />

      {/* Main Content Area shifted right on desktop */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    </div>
  );
}

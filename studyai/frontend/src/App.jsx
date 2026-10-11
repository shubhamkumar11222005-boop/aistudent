import React, { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ChatPage } from './pages/ChatPage';
import { QuizPage } from './pages/QuizPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { LandingPage } from './pages/LandingPage';
import { useHealthCheck } from './hooks/useHealthCheck';

export default function App() {
  // Active document ID passed into ChatPage or QuizPage
  const [activeDocId, setActiveDocId] = useState(null);

  const validRoutes = [
    'dashboard', 
    'documents', 
    'chat', 
    'quiz', 
    'analytics', 
    'settings', 
    'architecture', 
    'landing'
  ];

  // Client-side router defaulting to 'dashboard'
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (validRoutes.includes(hash)) {
      return hash;
    }
    return 'dashboard';
  });

  // Backend Health check hook (polls every 20s)
  const healthStatus = useHealthCheck(20000);

  // Sync hash changes with state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (validRoutes.includes(hash)) {
        setCurrentRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route, docId = null) => {
    if (docId !== null && docId !== undefined) {
      setActiveDocId(docId);
    }
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <DashboardPage 
            healthStatus={healthStatus} 
            onNavigate={navigateTo} 
          />
        );
      case 'documents':
        return (
          <DocumentsPage 
            onNavigate={navigateTo} 
          />
        );
      case 'chat':
        return (
          <ChatPage 
            initialDocId={activeDocId} 
            onNavigate={navigateTo} 
          />
        );
      case 'quiz':
        return (
          <QuizPage 
            initialDocId={activeDocId} 
            onNavigate={navigateTo} 
          />
        );
      case 'analytics':
        return (
          <AnalyticsPage 
            onNavigate={navigateTo} 
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            healthStatus={healthStatus} 
            onNavigate={navigateTo} 
          />
        );
      case 'architecture':
        return (
          <ArchitecturePage 
            healthStatus={healthStatus} 
            onRefreshHealth={healthStatus.refresh} 
          />
        );
      case 'landing':
      default:
        return (
          <LandingPage 
            onNavigate={navigateTo} 
            healthStatus={healthStatus} 
          />
        );
    }
  };

  return (
    <MainLayout
      currentRoute={currentRoute}
      onNavigate={navigateTo}
      healthStatus={healthStatus}
    >
      {renderCurrentView()}
    </MainLayout>
  );
}

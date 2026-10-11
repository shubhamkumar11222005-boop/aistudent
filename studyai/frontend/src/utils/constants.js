/**
 * Application Constants
 */
export const APP_NAME = "StudyAI";
export const APP_TAGLINE = "AI-Powered Study Assistant";
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL =
  rawBaseUrl.startsWith('http://') || rawBaseUrl.startsWith('https://')
    ? rawBaseUrl.replace(/\/+$/, '')
    : '';

export const PROJECT_METADATA = {
  version: "0.2.0",
  currentStep: "Step 2: Document Management & Database Layer",
  totalSteps: 6,
  authorRole: "B.Tech ECE 3rd Year Intern",
  techStack: {
    frontend: "React, Vite, Tailwind CSS, Lucide Icons",
    backend: "Python, FastAPI, Uvicorn, PyPDF",
    database: "SQLite, SQLAlchemy ORM",
    ai: "LLM API Integration (Scheduled for Step 4)"
  },
  roadmap: [
    { step: 1, title: "Foundation & Architecture", status: "completed", desc: "FastAPI + React + SQLite + Health Check" },
    { step: 2, title: "Document Management & Database Layer", status: "completed", desc: "PDF Upload, PyPDF text extraction, SQLite document persistence" },
    { step: 3, title: "Study Workspace & Notes Engine", status: "upcoming", desc: "Markdown study notes, subject organization" },
    { step: 4, title: "LLM AI Engine Integration", status: "upcoming", desc: "Contextual study assistance, summaries & flashcards" },
    { step: 5, title: "Analytics & Smart Quiz Engine", status: "upcoming", desc: "Spaced repetition, performance metrics" },
    { step: 6, title: "Production Polish & Deployment", status: "upcoming", desc: "Cloud deployment, performance optimization" },
  ]
};

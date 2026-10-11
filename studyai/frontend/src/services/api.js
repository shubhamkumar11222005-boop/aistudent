import { API_BASE_URL } from '../utils/constants';

/**
 * Service to check backend health status.
 * Target: GET /api/health
 */
export async function checkBackendHealth() {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!response.ok) {
      return {
        success: false,
        error: `Server responded with HTTP status ${response.status}`,
        status: "error",
        application: "Unknown",
        latencyMs: elapsed,
        timestamp: new Date().toISOString()
      };
    }

    const data = await response.json();
    return {
      success: true,
      status: data.status || "ok",
      application: data.application || "StudyAI",
      latencyMs: elapsed,
      raw: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: error.message || "Failed to reach backend server",
      status: "disconnected",
      application: "StudyAI",
      latencyMs: elapsed,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get all documents from backend SQLite database.
 * Target: GET /api/documents
 */
export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch documents (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Get full document details including full extracted text by ID.
 * Target: GET /api/documents/{id}
 */
export async function fetchDocumentById(id) {
  const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Document not found (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Upload a PDF file with real-time upload progress tracking.
 * Target: POST /api/documents/upload
 */
export function uploadDocument(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', `${API_BASE_URL}/api/documents/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentCompleted = Math.round((e.loaded * 100) / e.total);
          onProgress(percentCompleted);
        }
      });
    }

    xhr.onload = () => {
      try {
        const responseData = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseData);
        } else {
          reject(new Error(responseData.detail || `Upload failed with status ${xhr.status}`));
        }
      } catch (err) {
        reject(new Error(`Server response parse error: ${err.message}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload. Please check backend connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Document upload request timed out.'));
    };

    xhr.send(formData);
  });
}

/**
 * Delete a document by ID.
 * Target: DELETE /api/documents/{id}
 */
export async function deleteDocument(id) {
  const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete document (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Send a question to the AI Chat RAG engine for a specific document.
 * Target: POST /api/chat
 */
export async function chatWithDocument(documentId, question) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      document_id: Number(documentId),
      question: question.trim(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Chat request failed (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Fetch chat history for a specific document.
 * Target: GET /api/chat/history/{document_id}
 */
export async function fetchChatHistory(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/chat/history/${documentId}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

/**
 * Fetch all stored chunks for a specific document.
 * Target: GET /api/documents/{id}/chunks
 */
export async function fetchDocumentChunks(documentId) {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/chunks`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch chunks (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Fetch AI service configuration status (Demo Mode vs Live AI).
 * Target: GET /api/chat/status
 */
export async function fetchChatStatus() {
  const response = await fetch(`${API_BASE_URL}/api/chat/status`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    return { demo_mode: true, has_api_key: false, model: "gemini-3.6-flash" };
  }

  return await response.json();
}

/**
 * Generate AI multiple-choice quiz from document.
 * Target: POST /api/quiz/generate
 */
export async function generateQuiz(documentId, numberOfQuestions = 5, difficulty = 'Medium') {
  const response = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      document_id: Number(documentId),
      number_of_questions: Number(numberOfQuestions),
      difficulty: String(difficulty),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to generate quiz (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Get quiz questions for taking.
 * Target: GET /api/quiz/{quizId}
 */
export async function fetchQuiz(quizId) {
  const response = await fetch(`${API_BASE_URL}/api/quiz/${quizId}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch quiz (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Submit quiz answers and calculate score.
 * Target: POST /api/quiz/submit
 */
export async function submitQuiz(quizId, answers) {
  const response = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      quiz_id: Number(quizId),
      answers: answers,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to submit quiz (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Fetch list of all quizzes created.
 * Target: GET /api/quiz/list
 */
export async function fetchQuizzesList() {
  const response = await fetch(`${API_BASE_URL}/api/quiz/list`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch quizzes list (Status: ${response.status})`);
  }

  return await response.json();
}

/**
 * Fetch genuine study analytics from SQLite database.
 * Target: GET /api/analytics
 */
export async function fetchAnalytics() {
  const response = await fetch(`${API_BASE_URL}/api/analytics`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch analytics (Status: ${response.status})`);
  }

  return await response.json();
}

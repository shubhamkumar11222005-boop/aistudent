export interface DocumentRecord {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  page_count: number;
  upload_date: string;
  processing_status: string;
  text_preview: string;
  extracted_text: string;
  file_path?: string | null;
}

export interface DocumentChunkRecord {
  id: number;
  document_id: number;
  document_name?: string;
  chunk_index: number;
  page_number: number;
  content: string;
}

export interface QuizQuestionRecord {
  id: number;
  quiz_id: number;
  question_index: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface QuizRecord {
  id: number;
  document_id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  number_of_questions: number;
  created_at: string;
  questions: QuizQuestionRecord[];
}

export interface QuizAttemptRecord {
  id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  user_answers: Record<string | number, string>;
  completed_at: string;
}

export interface SourceChunkItem {
  document_id?: number;
  document_name?: string;
  chunk_index: number;
  page_number: number;
  content: string;
  relevance_score: number;
}

export interface ChatQueryRecord {
  id: number;
  document_id?: number | null;
  document_name?: string;
  question: string;
  answer: string;
  sources: SourceChunkItem[];
  created_at: string;
}

export interface ActivityItem {
  id: string;
  type: 'quiz_completed' | 'chat_question' | 'document_uploaded';
  title: string;
  description: string;
  timestamp: string;
  meta?: Record<string, any>;
}

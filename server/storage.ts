import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import {
  DocumentRecord,
  DocumentChunkRecord,
  QuizRecord,
  QuizQuestionRecord,
  QuizAttemptRecord,
  ChatQueryRecord,
  ActivityItem,
  SourceChunkItem,
} from './types';
import { chunkText } from './services/chunking';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'studyai_store.json');

export interface StoreData {
  documents: DocumentRecord[];
  chunks: DocumentChunkRecord[];
  quizzes: QuizRecord[];
  attempts: QuizAttemptRecord[];
  queries: ChatQueryRecord[];
  activity: ActivityItem[];
  nextDocId: number;
  nextChunkId: number;
  nextQuizId: number;
  nextQuestionId: number;
  nextAttemptId: number;
  nextQueryId: number;
}

class Storage {
  private data: StoreData = {
    documents: [],
    chunks: [],
    quizzes: [],
    attempts: [],
    queries: [],
    activity: [],
    nextDocId: 1,
    nextChunkId: 1,
    nextQuizId: 1,
    nextQuestionId: 1,
    nextAttemptId: 1,
    nextQueryId: 1,
  };

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Storage] Could not load persisted data:', e);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Storage] Could not persist data:', e);
    }
  }

  public async seedInitialDocumentsIfEmpty() {
    if (this.data.documents.length > 0) return;

    console.log('[Storage] Seeding initial study documents from repository...');
    const sampleFiles = [
      {
        path: path.resolve(process.cwd(), 'sample_biology_notes.pdf'),
        filename: 'sample_biology_notes.pdf',
      },
      {
        path: path.resolve(process.cwd(), 'digital_signal_processing_ch1.pdf'),
        filename: 'digital_signal_processing_ch1.pdf',
      },
    ];

    for (const sample of sampleFiles) {
      if (fs.existsSync(sample.path)) {
        try {
          const buf = fs.readFileSync(sample.path);
          const parser = new PDFParse({ data: buf });
          const parsed = await parser.getText();

          const pageCount = parsed.total || (parsed.pages ? parsed.pages.length : 1);
          const extractedText = parsed.text || '';

          const doc = this.addDocument({
            original_filename: sample.filename,
            file_size: buf.length,
            page_count: pageCount,
            extracted_text: extractedText,
          });

          console.log(`[Storage] Seeded "${sample.filename}" (ID: ${doc.id}, ${pageCount} pages, ${extractedText.length} chars)`);
        } catch (err) {
          console.warn(`[Storage] Failed to parse sample PDF "${sample.filename}":`, err);
        }
      }
    }
  }

  // --- Document Operations ---
  public getDocuments(): DocumentRecord[] {
    return [...this.data.documents].sort(
      (a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
    );
  }

  public getDocumentById(id: number): DocumentRecord | undefined {
    return this.data.documents.find((d) => d.id === id);
  }

  public addDocument(params: {
    original_filename: string;
    file_size: number;
    page_count: number;
    extracted_text: string;
    file_path?: string;
  }): DocumentRecord {
    const id = this.data.nextDocId++;
    const uploadDate = new Date().toISOString();
    const preview =
      params.extracted_text.length > 200
        ? params.extracted_text.slice(0, 200) + '...'
        : params.extracted_text;

    const doc: DocumentRecord = {
      id,
      filename: `${Date.now()}_${params.original_filename}`,
      original_filename: params.original_filename,
      file_size: params.file_size,
      page_count: params.page_count,
      upload_date: uploadDate,
      processing_status: 'completed',
      text_preview: preview,
      extracted_text: params.extracted_text,
      file_path: params.file_path || null,
    };

    this.data.documents.push(doc);

    // Generate chunks
    const chunkItems = chunkText(params.extracted_text);
    for (const item of chunkItems) {
      this.data.chunks.push({
        id: this.data.nextChunkId++,
        document_id: id,
        chunk_index: item.chunk_index,
        page_number: item.page_number,
        content: item.content,
      });
    }

    // Add activity
    this.addActivity({
      type: 'document_uploaded',
      title: `Uploaded: ${doc.original_filename}`,
      description: `${doc.page_count} pages • ${(doc.file_size / 1024).toFixed(1)} KB`,
      meta: { pages: doc.page_count },
    });

    this.saveToDisk();
    return doc;
  }

  public deleteDocument(id: number): DocumentRecord | null {
    const idx = this.data.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    const doc = this.data.documents[idx];
    this.data.documents.splice(idx, 1);

    // Delete associated chunks
    this.data.chunks = this.data.chunks.filter((c) => c.document_id !== id);

    // Delete associated quizzes
    const quizIdsToRemove = this.data.quizzes
      .filter((q) => q.document_id === id)
      .map((q) => q.id);
    this.data.quizzes = this.data.quizzes.filter((q) => q.document_id !== id);
    this.data.attempts = this.data.attempts.filter((a) => !quizIdsToRemove.includes(a.quiz_id));
    this.data.queries = this.data.queries.filter((q) => q.document_id !== id);

    this.saveToDisk();
    return doc;
  }

  // --- Chunk Operations ---
  public getChunksForDocument(docId: number): DocumentChunkRecord[] {
    const doc = this.getDocumentById(docId);
    const docName = doc ? doc.original_filename : 'Document';

    let chunks = this.data.chunks
      .filter((c) => c.document_id === docId)
      .sort((a, b) => a.chunk_index - b.chunk_index);

    if (chunks.length === 0 && doc && doc.extracted_text) {
      const chunkItems = chunkText(doc.extracted_text);
      for (const item of chunkItems) {
        const rec: DocumentChunkRecord = {
          id: this.data.nextChunkId++,
          document_id: docId,
          document_name: docName,
          chunk_index: item.chunk_index,
          page_number: item.page_number,
          content: item.content,
        };
        this.data.chunks.push(rec);
        chunks.push(rec);
      }
      this.saveToDisk();
    }

    return chunks.map((c) => ({
      ...c,
      document_name: docName,
    }));
  }

  public getAllChunks(docIds?: number[]): DocumentChunkRecord[] {
    const allDocs = this.getDocuments();
    const docMap = new Map(allDocs.map((d) => [d.id, d.original_filename]));
    const targetIds = docIds && docIds.length > 0 ? docIds : allDocs.map((d) => d.id);

    const result: DocumentChunkRecord[] = [];
    for (const id of targetIds) {
      const chunks = this.getChunksForDocument(id);
      const docName = docMap.get(id) || 'Document';
      for (const c of chunks) {
        result.push({
          ...c,
          document_name: docName,
        });
      }
    }
    return result;
  }

  // --- Quiz Operations ---
  public addQuiz(params: {
    document_id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questions: Omit<QuizQuestionRecord, 'id' | 'quiz_id'>[];
  }): QuizRecord {
    const id = this.data.nextQuizId++;
    const createdAt = new Date().toISOString();

    const questions: QuizQuestionRecord[] = params.questions.map((q, idx) => ({
      id: this.data.nextQuestionId++,
      quiz_id: id,
      question_index: idx,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));

    const quiz: QuizRecord = {
      id,
      document_id: params.document_id,
      title: params.title,
      difficulty: params.difficulty,
      number_of_questions: questions.length,
      created_at: createdAt,
      questions,
    };

    this.data.quizzes.push(quiz);
    this.saveToDisk();
    return quiz;
  }

  public getQuizById(id: number): QuizRecord | undefined {
    return this.data.quizzes.find((q) => q.id === id);
  }

  public getQuizzes(): {
    id: number;
    document_id: number;
    document_name: string;
    title: string;
    difficulty: string;
    number_of_questions: number;
    created_at: string;
    attempts_count: number;
    best_percentage: number | null;
  }[] {
    return this.data.quizzes
      .map((q) => {
        const doc = this.getDocumentById(q.document_id);
        const attempts = this.data.attempts.filter((a) => a.quiz_id === q.id);
        const bestPct =
          attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null;

        return {
          id: q.id,
          document_id: q.document_id,
          document_name: doc ? doc.original_filename : 'Document',
          title: q.title,
          difficulty: q.difficulty,
          number_of_questions: q.number_of_questions,
          created_at: q.created_at,
          attempts_count: attempts.length,
          best_percentage: bestPct,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addQuizAttempt(params: {
    quiz_id: number;
    score: number;
    total_questions: number;
    percentage: number;
    user_answers: Record<string | number, string>;
  }): QuizAttemptRecord {
    const id = this.data.nextAttemptId++;
    const attempt: QuizAttemptRecord = {
      id,
      quiz_id: params.quiz_id,
      score: params.score,
      total_questions: params.total_questions,
      percentage: params.percentage,
      user_answers: params.user_answers,
      completed_at: new Date().toISOString(),
    };

    this.data.attempts.push(attempt);

    const quiz = this.getQuizById(params.quiz_id);
    this.addActivity({
      type: 'quiz_completed',
      title: `Completed: ${quiz ? quiz.title : 'Study Quiz'}`,
      description: `Score: ${attempt.score}/${attempt.total_questions} (${attempt.percentage}%)`,
      meta: {
        score: attempt.score,
        total: attempt.total_questions,
        percentage: attempt.percentage,
        difficulty: quiz ? quiz.difficulty : 'Medium',
      },
    });

    this.saveToDisk();
    return attempt;
  }

  // --- Chat Query Operations ---
  public addChatQuery(params: {
    document_id?: number | null;
    document_name?: string;
    question: string;
    answer: string;
    sources: SourceChunkItem[];
  }): ChatQueryRecord {
    const id = this.data.nextQueryId++;
    const doc = params.document_id ? this.getDocumentById(params.document_id) : null;
    const docName = params.document_name || (doc ? doc.original_filename : 'All Documents');

    const query: ChatQueryRecord = {
      id,
      document_id: params.document_id ?? null,
      document_name: docName,
      question: params.question,
      answer: params.answer,
      sources: params.sources,
      created_at: new Date().toISOString(),
    };

    this.data.queries.push(query);

    const preview =
      params.question.length > 60 ? params.question.slice(0, 60) + '...' : params.question;

    this.addActivity({
      type: 'chat_question',
      title: `Asked AI: "${preview}"`,
      description: `RAG query on ${docName}`,
      meta: { document_name: docName },
    });

    this.saveToDisk();
    return query;
  }

  public getChatHistory(docId?: number | 'all' | null): ChatQueryRecord[] {
    if (!docId || docId === 'all') {
      return [...this.data.queries].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
    return this.data.queries
      .filter((q) => q.document_id === Number(docId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public clearChatHistory(docId?: number | 'all' | null): void {
    if (!docId || docId === 'all') {
      this.data.queries = [];
    } else {
      this.data.queries = this.data.queries.filter((q) => q.document_id !== Number(docId));
    }
    this.saveToDisk();
  }

  // --- Activity & Analytics Operations ---
  public addActivity(params: {
    type: 'quiz_completed' | 'chat_question' | 'document_uploaded';
    title: string;
    description: string;
    meta?: Record<string, any>;
  }) {
    const item: ActivityItem = {
      id: `${params.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: params.type,
      title: params.title,
      description: params.description,
      timestamp: new Date().toISOString(),
      meta: params.meta,
    };
    this.data.activity.unshift(item);
    if (this.data.activity.length > 50) {
      this.data.activity = this.data.activity.slice(0, 50);
    }
  }

  public getAnalytics() {
    const totalDocs = this.data.documents.length;
    const questionsAsked = this.data.queries.length;
    const quizzesCompleted = this.data.attempts.length;

    let averageQuizScore = 0.0;
    if (this.data.attempts.length > 0) {
      const sum = this.data.attempts.reduce((acc, curr) => acc + curr.percentage, 0);
      averageQuizScore = Math.round((sum / this.data.attempts.length) * 10) / 10;
    }

    const recentlyUploaded = this.getDocuments()
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        filename: d.filename,
        original_filename: d.original_filename,
        file_size: d.file_size,
        page_count: d.page_count,
        upload_date: d.upload_date,
        processing_status: d.processing_status,
        text_preview: d.text_preview,
      }));

    const diffStats: Record<string, { attempts_count: number; average_percentage: number }> = {
      Easy: { attempts_count: 0, average_percentage: 0 },
      Medium: { attempts_count: 0, average_percentage: 0 },
      Hard: { attempts_count: 0, average_percentage: 0 },
    };

    for (const diff of ['Easy', 'Medium', 'Hard'] as const) {
      const quizIdsForDiff = this.data.quizzes
        .filter((q) => q.difficulty === diff)
        .map((q) => q.id);
      const attemptsForDiff = this.data.attempts.filter((a) =>
        quizIdsForDiff.includes(a.quiz_id)
      );
      const count = attemptsForDiff.length;
      const avg =
        count > 0
          ? Math.round(
              (attemptsForDiff.reduce((acc, a) => acc + a.percentage, 0) / count) * 10
            ) / 10
          : 0.0;
      diffStats[diff] = {
        attempts_count: count,
        average_percentage: avg,
      };
    }

    const trendAttempts = [...this.data.attempts]
      .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
      .slice(-10);

    const scoreTrend = trendAttempts.map((att) => {
      const quiz = this.getQuizById(att.quiz_id);
      const date = new Date(att.completed_at);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        attempt_id: att.id,
        quiz_title: quiz ? quiz.title : 'Quiz',
        percentage: att.percentage,
        score: att.score,
        total: att.total_questions,
        completed_at: formattedDate,
      };
    });

    return {
      total_documents: totalDocs,
      questions_asked: questionsAsked,
      quizzes_completed: quizzesCompleted,
      average_quiz_score: averageQuizScore,
      recently_uploaded_documents: recentlyUploaded,
      recent_activity: this.data.activity.slice(0, 10),
      performance_by_difficulty: diffStats,
      score_trend: scoreTrend,
    };
  }
}

export const storage = new Storage();

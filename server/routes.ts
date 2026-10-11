import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import { storage } from './storage';
import { retrieveChunks } from './services/retrieval';
import { aiService } from './services/ai';
import { quizService } from './services/quiz';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

export const apiRouter = Router();

// 1. Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    application: 'StudyAI',
  });
});

// 2. Documents listing
apiRouter.get('/documents', (req: Request, res: Response) => {
  const docs = storage.getDocuments().map((d) => ({
    id: d.id,
    filename: d.filename,
    original_filename: d.original_filename,
    file_size: d.file_size,
    page_count: d.page_count,
    upload_date: d.upload_date,
    processing_status: d.processing_status,
    text_preview: d.text_preview,
  }));
  return res.json(docs);
});

// 3. Document detail
apiRouter.get('/documents/:document_id', (req: Request, res: Response) => {
  const docId = parseInt(req.params.document_id, 10);
  const doc = storage.getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ detail: `Document with ID ${docId} was not found.` });
  }
  return res.json(doc);
});

// 4. Document upload
apiRouter.post(
  '/documents/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ detail: 'No file provided in upload request.' });
      }

      const originalName = req.file.originalname || 'document.pdf';
      const isPdf =
        req.file.mimetype === 'application/pdf' ||
        originalName.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        return res
          .status(400)
          .json({ detail: 'Only PDF documents are supported for upload.' });
      }

      // Parse PDF
      let extractedText = '';
      let pageCount = 1;

      try {
        const parser = new PDFParse({ data: req.file.buffer });
        const parsed = await parser.getText();
        extractedText = parsed.text || '';
        pageCount = parsed.total || (parsed.pages ? parsed.pages.length : 1);
      } catch (pdfErr: any) {
        return res
          .status(400)
          .json({ detail: `Failed to parse PDF document: ${pdfErr.message || pdfErr}` });
      }

      if (!extractedText.trim()) {
        return res.status(400).json({
          detail:
            'The uploaded PDF contains no extractable text. Please ensure it is not a scanned image PDF.',
        });
      }

      const doc = storage.addDocument({
        original_filename: originalName,
        file_size: req.file.size,
        page_count: pageCount,
        extracted_text: extractedText,
      });

      return res.status(201).json(doc);
    } catch (err: any) {
      console.error('[Upload error]', err);
      return res.status(500).json({ detail: `Upload processing failed: ${err.message}` });
    }
  }
);

// 5. Delete document
apiRouter.delete('/documents/:document_id', (req: Request, res: Response) => {
  const docId = parseInt(req.params.document_id, 10);
  const deleted = storage.deleteDocument(docId);
  if (!deleted) {
    return res.status(404).json({ detail: `Document with ID ${docId} not found.` });
  }
  return res.json({
    success: true,
    message: `Document '${deleted.original_filename}' successfully deleted.`,
    id: docId,
  });
});

// 6. Get document chunks
apiRouter.get('/documents/:document_id/chunks', (req: Request, res: Response) => {
  const docId = parseInt(req.params.document_id, 10);
  const doc = storage.getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ detail: `Document with ID ${docId} was not found.` });
  }
  const chunks = storage.getChunksForDocument(docId);
  return res.json({
    document_id: doc.id,
    document_name: doc.original_filename,
    total_chunks: chunks.length,
    chunks: chunks.map((c) => ({
      id: c.id,
      document_id: c.document_id,
      chunk_index: c.chunk_index,
      page_number: c.page_number,
      content: c.content,
    })),
  });
});

// 7. Chat status
apiRouter.get('/chat/status', (req: Request, res: Response) => {
  const demoMode = aiService.isDemoMode();
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
  return res.json({
    demo_mode: demoMode,
    has_api_key: Boolean(apiKey.trim()),
    model: 'gemini-3.8-flash',
    retrieval_strategy: 'KeywordRelevanceRetriever (TF-ICF + Phrase Matching)',
    chunking_strategy: 'Sliding window (600 chars, 100 overlap, paragraph-aware)',
  });
});

// 8. Chat history
apiRouter.get('/chat/history/:document_id', (req: Request, res: Response) => {
  const docId = parseInt(req.params.document_id, 10);
  const doc = storage.getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ detail: `Document with ID ${docId} was not found.` });
  }
  const history = storage.getChatHistory(docId);
  return res.json(history);
});

// 9. Post chat query
apiRouter.post('/chat', async (req: Request, res: Response) => {
  const { document_id, question } = req.body;
  const docId = Number(document_id);
  if (!docId || !question || !String(question).trim()) {
    return res.status(400).json({ detail: 'document_id and non-empty question are required.' });
  }

  const doc = storage.getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ detail: `Document with ID ${docId} was not found.` });
  }

  const chunks = storage.getChunksForDocument(docId);
  if (chunks.length === 0) {
    return res.json({
      answer: `The document **${doc.original_filename}** has no extractable text.`,
      sources: [],
      demo_mode: aiService.isDemoMode(),
      document_id: doc.id,
      document_name: doc.original_filename,
    });
  }

  const retrieved = retrieveChunks(chunks, String(question).trim(), 4);
  const contextParts = retrieved.map(
    (c) => `[Chunk ${c.chunk_index + 1} | Page ${c.page_number}]\n${c.content}`
  );
  const contextText = contextParts.join('\n\n');

  try {
    const result = await aiService.answerQuestion(
      String(question).trim(),
      contextText,
      doc.original_filename,
      retrieved
    );

    // Save query to history
    storage.addChatQuery({
      document_id: docId,
      question: String(question).trim(),
      answer: result.answer,
      sources: result.sources,
    });

    return res.json({
      answer: result.answer,
      sources: result.sources,
      demo_mode: result.demo_mode,
      document_id: doc.id,
      document_name: doc.original_filename,
    });
  } catch (err: any) {
    console.error('[Chat error]', err);
    return res.status(500).json({ detail: `Failed to process chat: ${err.message}` });
  }
});

// 10. Generate Quiz
apiRouter.post('/quiz/generate', async (req: Request, res: Response) => {
  const { document_id, number_of_questions = 5, difficulty = 'Medium' } = req.body;
  const docId = Number(document_id);
  const numQ = Math.max(1, Math.min(20, Number(number_of_questions) || 5));

  let diffNorm: 'Easy' | 'Medium' | 'Hard' = 'Medium';
  const diffInput = String(difficulty).trim().toLowerCase();
  if (diffInput === 'easy') diffNorm = 'Easy';
  else if (diffInput === 'hard') diffNorm = 'Hard';

  const doc = storage.getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ detail: `Document with ID ${docId} was not found.` });
  }

  const rawText = (doc.extracted_text || '').trim();
  if (!rawText || rawText.length < 40) {
    return res.status(400).json({
      detail: `Document '${doc.original_filename}' does not contain sufficient text to generate a quiz.`,
    });
  }

  try {
    const questions = await quizService.generateQuestions(
      rawText,
      doc.original_filename,
      numQ,
      diffNorm
    );

    if (questions.length === 0) {
      return res.status(500).json({ detail: 'Failed to generate questions from document.' });
    }

    const title = `${doc.original_filename.replace(/\.pdf$/i, '')} Quiz (${diffNorm})`;
    const quiz = storage.addQuiz({
      document_id: docId,
      title,
      difficulty: diffNorm,
      questions,
    });

    // Return sanitized quiz for taking
    return res.status(201).json({
      id: quiz.id,
      document_id: quiz.document_id,
      document_name: doc.original_filename,
      title: quiz.title,
      difficulty: quiz.difficulty,
      number_of_questions: quiz.number_of_questions,
      created_at: quiz.created_at,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question_index: q.question_index,
        question: q.question,
        options: q.options,
      })),
    });
  } catch (err: any) {
    console.error('[Quiz gen error]', err);
    return res.status(500).json({ detail: `Failed to generate quiz: ${err.message}` });
  }
});

// 11. Get Quiz for taking
apiRouter.get('/quiz/:quiz_id', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quiz_id, 10);
  const quiz = storage.getQuizById(quizId);
  if (!quiz) {
    return res.status(404).json({ detail: `Quiz with ID ${quizId} was not found.` });
  }

  const doc = storage.getDocumentById(quiz.document_id);
  return res.json({
    id: quiz.id,
    document_id: quiz.document_id,
    document_name: doc ? doc.original_filename : 'Document',
    title: quiz.title,
    difficulty: quiz.difficulty,
    number_of_questions: quiz.number_of_questions,
    created_at: quiz.created_at,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      question_index: q.question_index,
      question: q.question,
      options: q.options,
    })),
  });
});

// 12. Submit Quiz
const handleQuizSubmit = (quizId: number, answers: Record<string, string>, res: Response) => {
  const quiz = storage.getQuizById(quizId);
  if (!quiz) {
    return res.status(404).json({ detail: `Quiz with ID ${quizId} was not found.` });
  }

  let correctCount = 0;
  const total = quiz.questions.length;

  const results = quiz.questions.map((q) => {
    const selected = answers[q.id] || answers[String(q.id)] || null;
    const isCorrect = selected ? selected.trim() === q.correct_answer.trim() : false;
    if (isCorrect) correctCount++;

    return {
      question_id: q.id,
      question_index: q.question_index,
      question: q.question,
      options: q.options,
      selected_answer: selected,
      correct_answer: q.correct_answer,
      is_correct: isCorrect,
      explanation: q.explanation,
    };
  });

  const percentage = total > 0 ? Math.round((correctCount / total) * 1000) / 10 : 0;
  const attempt = storage.addQuizAttempt({
    quiz_id: quiz.id,
    score: correctCount,
    total_questions: total,
    percentage,
    user_answers: answers,
  });

  return res.json({
    attempt_id: attempt.id,
    quiz_id: quiz.id,
    score: correctCount,
    total_questions: total,
    percentage,
    results,
    completed_at: attempt.completed_at,
  });
};

apiRouter.post('/quiz/submit', (req: Request, res: Response) => {
  const { quiz_id, answers = {} } = req.body;
  return handleQuizSubmit(Number(quiz_id), answers, res);
});

apiRouter.post('/quiz/:quiz_id/submit', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quiz_id, 10);
  const answers = req.body.answers || req.body || {};
  return handleQuizSubmit(quizId, answers, res);
});

// 13. List Quizzes
apiRouter.get('/quiz/list', (req: Request, res: Response) => {
  const list = storage.getQuizzes();
  return res.json(list);
});

// 14. Analytics
apiRouter.get('/analytics', (req: Request, res: Response) => {
  const analytics = storage.getAnalytics();
  return res.json(analytics);
});

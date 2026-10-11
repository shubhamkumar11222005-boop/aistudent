import { GoogleGenAI, Type } from '@google/genai';
import { QuizQuestionRecord } from '../types';

export class QuizService {
  private getApiKey(): string {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.AI_API_KEY ||
      ''
    ).trim();
  }

  public isDemoMode(): boolean {
    const hasKey = Boolean(this.getApiKey());
    if (hasKey) {
      return (process.env.DEMO_MODE || '').toLowerCase() === 'force';
    }
    return true;
  }

  public async generateQuestions(
    rawText: string,
    docName: string,
    numQuestions: number,
    difficulty: 'Easy' | 'Medium' | 'Hard'
  ): Promise<Omit<QuizQuestionRecord, 'id' | 'quiz_id'>[]> {
    const numQ = Math.max(1, Math.min(20, numQuestions));
    const apiKey = this.getApiKey();
    const demoMode = this.isDemoMode();

    if (!demoMode && apiKey) {
      try {
        const questions = await this.generateWithGemini(
          rawText,
          docName,
          numQ,
          difficulty,
          apiKey
        );
        if (questions && questions.length >= numQ) {
          return questions.slice(0, numQ);
        }
      } catch (err) {
        console.warn('[StudyAI Server] Live Gemini quiz generation failed:', err);
      }
    }

    return this.generateGroundedFallback(rawText, docName, numQ, difficulty);
  }

  private async generateWithGemini(
    text: string,
    docName: string,
    numQ: number,
    difficulty: string,
    apiKey: string
  ): Promise<Omit<QuizQuestionRecord, 'id' | 'quiz_id'>[]> {
    const trimmedContext = text.slice(0, 14000);
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are an expert academic examiner.
Document: "${docName}"
Content:
----------------------------------------
${trimmedContext}
----------------------------------------

Task:
Generate exactly ${numQ} multiple-choice questions of ${difficulty} difficulty based STRICTLY on the document content.

Requirements:
1. Each question must have EXACTLY 4 distinct, plausible options.
2. The 'correct_answer' MUST be identical to one of the strings in 'options'.
3. The 'explanation' must explain why the correct answer is right based on the text.`;

    const callPromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correct_answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'options', 'correct_answer', 'explanation'],
          },
        },
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Quiz generation timed out after 8s')), 8000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text?.trim() || '[]');
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item.question && Array.isArray(item.options) && item.options.length >= 4)
        .map((item, idx) => {
          let opts = item.options.slice(0, 4);
          let correct = item.correct_answer?.trim();
          if (!opts.includes(correct)) {
            opts[0] = correct || opts[0];
            correct = opts[0];
          }
          return {
            question_index: idx,
            question: item.question.trim(),
            options: opts,
            correct_answer: correct,
            explanation: item.explanation || `Derived directly from ${docName}.`,
          };
        });
    }
    return [];
  }

  private generateGroundedFallback(
    text: string,
    docName: string,
    numQ: number,
    difficulty: string
  ): Omit<QuizQuestionRecord, 'id' | 'quiz_id'>[] {
    const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const meaningfulLines = rawLines.filter(
      (l) => l.length > 25 && !l.startsWith('---') && !l.startsWith('[Chunk')
    );

    const candidates: { term: string; definition: string; line: string }[] = [];
    for (const line of meaningfulLines) {
      if (line.includes(':') && line.split(':')[0].length < 60) {
        const parts = line.split(':');
        const term = parts[0].trim().replace(/^[0-9\.\-\*#\s]+/, '');
        const definition = parts.slice(1).join(':').trim();
        if (
          term.length >= 3 &&
          definition.length >= 15 &&
          !/^chapter\s+\d+/i.test(term) &&
          !/^section\s+\d+/i.test(term) &&
          !/^page\s+\d+/i.test(term)
        ) {
          candidates.push({ term, definition, line });
        }
      } else if (line.includes(' is ')) {
        const parts = line.split(' is ');
        const term = parts[0].trim().replace(/^[0-9\.\-\*#\s]+/, '');
        const definition = parts.slice(1).join(' is ').trim();
        if (term.length >= 3 && definition.length >= 15) {
          candidates.push({ term, definition, line });
        }
      } else if (line.includes(' are ')) {
        const parts = line.split(' are ');
        const term = parts[0].trim().replace(/^[0-9\.\-\*#\s]+/, '');
        const definition = parts.slice(1).join(' are ').trim();
        if (term.length >= 3 && definition.length >= 15) {
          candidates.push({ term, definition, line });
        }
      }
    }

    const questions: Omit<QuizQuestionRecord, 'id' | 'quiz_id'>[] = [];

    // Standard high-quality academic distractors
    const backupDistractors = [
      'A passive storage substrate with no enzymatic or computational activity',
      'An inverted transformation mechanism that dampens intermediate signal frequencies',
      'A baseline thermodynamic threshold maintained exclusively during equilibrium states',
      'A secondary messenger cascade activated only under extreme regulatory repression',
      'A constant scaling coefficient determined strictly by initial boundary conditions',
      'An irreversible feedback loop decoupled from primary reactant concentrations'
    ];

    // Build questions from candidate terms
    for (let i = 0; i < candidates.length && questions.length < numQ; i++) {
      const c = candidates[i];
      const cleanTerm = c.term;
      let qText = `According to ${docName}, what is the primary role or definition of "${cleanTerm}"?`;
      if (difficulty === 'Hard') {
        qText = `In the context of ${docName}, which of the following accurately describes the behavior and significance of "${cleanTerm}"?`;
      }

      let correctOpt = c.definition.length > 120 ? c.definition.slice(0, 117) + '...' : c.definition;
      const otherTerms = candidates.filter((_, idx) => idx !== i);
      const distractors: string[] = otherTerms
        .map((ot) => (ot.definition.length > 120 ? ot.definition.slice(0, 117) + '...' : ot.definition))
        .filter((d) => d && d.trim().length > 10 && d !== correctOpt);

      for (const bd of backupDistractors) {
        if (distractors.length < 3 && !distractors.includes(bd) && bd !== correctOpt) {
          distractors.push(bd);
        }
      }

      let options = [correctOpt, ...distractors.slice(0, 3)];
      while (options.length < 4) {
        options.push(`Alternative contextual variation for ${cleanTerm}`);
      }
      options = options.slice(0, 4);

      const rot = i % 4;
      options = [...options.slice(rot), ...options.slice(0, rot)];

      questions.push({
        question_index: questions.length,
        question: qText,
        options,
        correct_answer: correctOpt,
        explanation: `In ${docName}: ${cleanTerm} is specifically documented as: "${c.definition.slice(0, 200)}".`,
      });
    }

    // Sentence completion fallback if more questions needed
    if (questions.length < numQ) {
      for (const line of meaningfulLines) {
        if (questions.length >= numQ) break;
        if (questions.some((q) => q.question.includes(line.slice(0, 30)))) continue;

        const words = line.split(/\s+/);
        if (words.length < 8) continue;

        const half = Math.floor(words.length / 2);
        const targetPhrase = words.slice(Math.max(0, half - 2), Math.min(words.length, half + 2)).join(' ');
        const blankedLine = line.replace(targetPhrase, '______');

        const correctAns = targetPhrase;
        const distractorOpts = [
          'inversely proportional variance',
          'static asymptotic threshold',
          'decoupled intermediate feedback',
        ];

        let allOpts = [correctAns, ...distractorOpts];
        const rot = questions.length % 4;
        allOpts = [...allOpts.slice(rot), ...allOpts.slice(0, rot)];

        questions.push({
          question_index: questions.length,
          question: `Complete the statement from ${docName}:\n"${blankedLine}"`,
          options: allOpts,
          correct_answer: correctAns,
          explanation: `The complete original statement reads: "${line}".`,
        });
      }
    }

    return questions.slice(0, numQ);
  }
}

export const quizService = new QuizService();

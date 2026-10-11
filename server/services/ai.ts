import { GoogleGenAI } from '@google/genai';
import { STOP_WORDS } from './retrieval';

const SYSTEM_PROMPT = `You are StudyAI, an expert, objective academic study assistant.
Your absolute directive is to answer the student's question primarily using the supplied document context.
If the answer cannot be found or reasonably inferred from the document material, clearly state:
"The requested information was not found in the uploaded document material."
Do not fabricate facts or hallucinate citations.
Format your responses cleanly using Markdown (bold key terms, bullet points, and code/math formatting where appropriate).`;

export class AIService {
  private getApiKey(): string {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.AI_API_KEY ||
      ''
    ).trim();
  }

  public isDemoMode(): boolean {
    const demoEnv = (process.env.DEMO_MODE || '').toLowerCase();
    const isExplicitDemo = demoEnv === 'true' || demoEnv === '1' || demoEnv === 'yes';
    const hasKey = Boolean(this.getApiKey());
    return isExplicitDemo || !hasKey;
  }

  public async answerQuestion(
    question: string,
    contextText: string,
    documentName: string,
    chunks: { chunk_index: number; page_number: number; content: string; score: number }[]
  ): Promise<{
    answer: string;
    sources: { chunk_index: number; page_number: number; content: string; relevance_score: number }[];
    demo_mode: boolean;
  }> {
    const cleanQ = question.trim();
    const sources = chunks.map((c) => ({
      chunk_index: c.chunk_index,
      page_number: c.page_number,
      content: c.content,
      relevance_score: c.score,
    }));

    if (!contextText.trim()) {
      return {
        answer: `The uploaded document **${documentName}** does not contain any extractable text content to answer this question.`,
        sources: [],
        demo_mode: this.isDemoMode(),
      };
    }

    const apiKey = this.getApiKey();
    const demoMode = this.isDemoMode();

    if (!demoMode && apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const userPrompt = `Context from uploaded document "${documentName}":
----------------------------------------
${contextText}
----------------------------------------

Student Question:
${cleanQ}

Please answer the question based primarily on the context above.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.2,
          },
        });

        const answerText = response.text?.trim();
        if (answerText) {
          return {
            answer: answerText,
            sources,
            demo_mode: false,
          };
        }
      } catch (err) {
        console.warn('[StudyAI Server] Gemini API call error:', err);
      }
    }

    // Grounded Demo Mode fallback
    const groundedAnswer = this.generateGroundedResponse(
      cleanQ,
      contextText,
      documentName,
      chunks
    );

    return {
      answer: groundedAnswer,
      sources,
      demo_mode: true,
    };
  }

  private generateGroundedResponse(
    question: string,
    contextText: string,
    documentName: string,
    chunks: { chunk_index: number; page_number: number; content: string; score: number }[]
  ): string {
    const qLower = question.toLowerCase();

    // Extract coherent sentences and statements from context
    const lines = contextText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !l.startsWith('---') && !l.startsWith('[Chunk'));

    const sentences: string[] = [];
    for (const line of lines) {
      const parts = line.split(/(?<=[.!?])\s+/).map((p) => p.trim()).filter((p) => p.length > 20);
      if (parts.length > 1) {
        sentences.push(...parts);
      } else {
        sentences.push(line);
      }
    }

    // Off-topic check
    const contextWords = new Set(
      contextText.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/)
    );
    const queryKeywords = qLower
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    if (queryKeywords.length >= 2) {
      const overlap = queryKeywords.filter((w) => contextWords.has(w));
      const isBroad = ['summary', 'summarize', 'notes', 'exam', 'simple', 'concept'].some(
        (kw) => qLower.includes(kw)
      );
      if (overlap.length === 0 && !isBroad) {
        return (
          `### Information Not Found in Document\n\n` +
          `The requested topic was **not found** in the uploaded material (\`${documentName}\`).\n\n` +
          `According to the StudyAI system instructions, answers are strictly grounded in your provided study materials to prevent misinformation. ` +
          `Please ensure your question relates to the subjects covered in this PDF.`
        );
      }
    }

    // 1. Summary request
    if (['summarize', 'summary', 'overview'].some((w) => qLower.includes(w))) {
      const summaryPoints = sentences.slice(0, 5).map((s) => {
        const cleanS = s.replace(/^\d+[\.\)]\s*/, '');
        return `- **Key Takeaway**: ${cleanS}`;
      });
      return (
        `### Document Summary: ${documentName}\n\n` +
        `Here is a structured executive summary synthesized from the retrieved sections of your uploaded material:\n\n` +
        (summaryPoints.length > 0
          ? summaryPoints.join('\n')
          : `- Content extracted from ${chunks.length} key sections.`) +
        `\n\n> *Source: Synthesized from ${chunks.length} retrieved chunks across ${documentName}.*`
      );
    }

    // 2. Difficult concepts
    if (qLower.includes('difficult') || qLower.includes('concept')) {
      const concepts = sentences.slice(0, 4).map((s, i) => {
        const cleanS = s.replace(/^\d+[\.\)]\s*/, '');
        const firstPhrase = cleanS.includes(':')
          ? cleanS.split(':')[0]
          : `Concept ${i + 1}`;
        return `- **${firstPhrase.trim()}**:\n  ${cleanS}`;
      });
      return (
        `### Core Academic Concepts\n\n` +
        `Based on the retrieved study chunks from **${documentName}**, here are the primary core concepts:\n\n` +
        (concepts.length > 0
          ? concepts.join('\n\n')
          : `- Technical concepts retrieved from document sections.`) +
        `\n\n**Study Tip**: Focus on how these components connect sequentially in practical exam questions.`
      );
    }

    // 3. Exam topics
    if (
      qLower.includes('exam') ||
      qLower.includes('test') ||
      qLower.includes('important')
    ) {
      const topics = sentences.slice(0, 4).map((s, i) => {
        const cleanS = s.replace(/^\d+[\.\)]\s*/, '');
        return `${i + 1}. **High-Yield Topic**: ${cleanS}`;
      });
      return (
        `### High-Yield Exam Topics\n\n` +
        `Key testable concepts extracted from **${documentName}**:\n\n` +
        (topics.length > 0 ? topics.join('\n\n') : `1. Core subject principles.`) +
        `\n\n*Review the definitions and formulas related to these items for best retention.*`
      );
    }

    // 4. Specific question matching
    const relevantSentences = sentences.filter((s) => {
      const sLower = s.toLowerCase();
      return queryKeywords.some((kw) => sLower.includes(kw));
    });

    const chosenSentences =
      relevantSentences.length > 0 ? relevantSentences.slice(0, 4) : sentences.slice(0, 3);

    return (
      `### Grounded Answer from ${documentName}\n\n` +
      chosenSentences
        .map((s) => `> ${s}`)
        .join('\n\n') +
      `\n\nThis information is referenced directly from page ${chunks[0]?.page_number || 1} of your notes.`
    );
  }
}

export const aiService = new AIService();

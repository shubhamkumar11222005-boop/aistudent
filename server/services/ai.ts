import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { STOP_WORDS } from './retrieval';
import { SourceChunkItem, DocumentChunkRecord } from '../types';

const SYSTEM_PROMPT = `You are StudyAI, an ultra-fast, expert Multi-Document Retrieval-Augmented Generation (RAG) study assistant.
You have access to the student's entire study knowledge base across all uploaded course materials.

Core Directives:
1. Unified Library Knowledge: Answer questions across all uploaded documents or compare concepts from multiple PDFs in a single unified chat.
2. Specific Citations: Whenever citing facts, formulas, or concepts, clearly reference the document title and page number, e.g. **[Document: filename.pdf | Page X]**.
3. Direct, Focused & Prompt Answers: Be concise, clear, and direct. Avoid unnecessary conversational filler. Use bullet points and bold key terms for readability.
4. Cross-Document Synthesis: When comparing topics, clearly distinguish between different documents.`;

export class AIService {
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
      const explicitForce = (process.env.DEMO_MODE || '').toLowerCase() === 'force';
      return explicitForce;
    }
    return true;
  }

  public async answerQuestion(
    question: string,
    contextText: string,
    documentScopeName: string,
    chunks: (DocumentChunkRecord & { score: number })[]
  ): Promise<{
    answer: string;
    sources: SourceChunkItem[];
    demo_mode: boolean;
  }> {
    const cleanQ = question.trim();
    const sources: SourceChunkItem[] = chunks.map((c) => ({
      document_id: c.document_id,
      document_name: c.document_name,
      chunk_index: c.chunk_index,
      page_number: c.page_number,
      content: c.content,
      relevance_score: c.score,
    }));

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

        const userPrompt = `Knowledge Base Scope: ${documentScopeName}

Retrieved Grounding Chunks across Documents:
----------------------------------------
${contextText || '(No specific text chunks retrieved)'}
----------------------------------------

Student Question:
${cleanQ}

Please provide a direct, concise, and structured answer citing specific document names and pages where applicable.`;

        // Fast model cascade: try ultra-low latency gemini-3.1-flash-lite first (1-3s), fallback to gemini-3.8-flash with ThinkingLevel.LOW
        const modelsToTry = [
          { name: 'gemini-3.1-flash-lite', config: { temperature: 0.2, maxOutputTokens: 1200 } },
          { name: 'gemini-3.8-flash', config: { temperature: 0.2, maxOutputTokens: 1200, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } }
        ];

        for (const m of modelsToTry) {
          try {
            // Guard with a 6-second timeout per attempt to eliminate long hangs
            const callPromise = ai.models.generateContent({
              model: m.name,
              contents: userPrompt,
              config: {
                systemInstruction: SYSTEM_PROMPT,
                ...m.config,
              },
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 6s on ${m.name}`)), 6000)
            );

            const response = await Promise.race([callPromise, timeoutPromise]);
            const answerText = response.text?.trim();
            if (answerText) {
              return {
                answer: answerText,
                sources,
                demo_mode: false,
              };
            }
          } catch (modelErr: any) {
            console.warn(`[StudyAI Server] Model ${m.name} skipped:`, modelErr?.message || modelErr);
          }
        }
      } catch (err: any) {
        console.warn('[StudyAI Server] Live Gemini API call error:', err?.message || err);
      }
    }

    // Grounded Demo Mode fallback (instantaneous response)
    const groundedAnswer = this.generateGroundedResponse(
      cleanQ,
      contextText,
      documentScopeName,
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
    documentScopeName: string,
    chunks: (DocumentChunkRecord & { score: number })[]
  ): string {
    const qLower = question.toLowerCase();

    // Check for meta / conversational queries
    const isMetaQuery = [
      'why are you',
      'why not',
      'how do you',
      'how does',
      'what can you',
      'who are you',
      'hello',
      'hi',
      'help me',
    ].some((phrase) => qLower.includes(phrase));

    if (isMetaQuery) {
      return (
        `### Unified Multi-Document StudyAI Assistant\n\n` +
        `I am **StudyAI**, your intelligent academic assistant powered by a unified Multi-Document Knowledge Base.\n\n` +
        `- **Multi-PDF RAG**: You can ask questions across all your uploaded PDFs in this single common chat without switching between documents.\n` +
        `- **Grounded Citations**: Answers reference the exact document title and page number from your uploaded notes.\n` +
        `- **Cross-Document Synthesis**: Compare topics or ask questions spanning multiple subjects simultaneously.\n` +
        `- **Practice Quizzes**: Test your understanding with auto-generated quizzes from any document.\n\n` +
        `Try asking questions about any topic across your uploaded materials!`
      );
    }

    // Group retrieved chunks by document
    const chunksByDoc: Record<string, (DocumentChunkRecord & { score: number })[]> = {};
    for (const chunk of chunks) {
      const docName = chunk.document_name || 'Document';
      if (!chunksByDoc[docName]) chunksByDoc[docName] = [];
      chunksByDoc[docName].push(chunk);
    }

    const docNames = Object.keys(chunksByDoc);

    // 1. Summary request
    if (['summarize', 'summary', 'overview'].some((w) => qLower.includes(w))) {
      let summaryText = `### Unified Knowledge Base Summary (${documentScopeName})\n\n`;
      summaryText += `Synthesized from **${chunks.length} grounded sections** across your course materials:\n\n`;

      for (const dName of docNames) {
        const docChunks = chunksByDoc[dName];
        summaryText += `#### 📄 ${dName}\n`;
        const snippet = docChunks[0]?.content?.slice(0, 300).trim();
        summaryText += `> ${snippet}...\n\n`;
        summaryText += `*Referenced from pages: ${Array.from(new Set(docChunks.map((c) => c.page_number))).join(', ')}*\n\n`;
      }

      return summaryText;
    }

    // 2. Specific questions & multi-document synthesis
    const queryKeywords = qLower
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    let response = `### Synthesized Answer (${documentScopeName})\n\n`;

    if (docNames.length > 1) {
      response += `Here are the relevant findings retrieved across your uploaded documents:\n\n`;
      for (const dName of docNames) {
        const docChunks = chunksByDoc[dName];
        response += `#### 📄 ${dName}\n`;

        const bestChunk = docChunks[0];
        const sentences = bestChunk.content
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 15);

        const relevant = sentences.filter((s) =>
          queryKeywords.some((kw) => s.toLowerCase().includes(kw))
        );

        const chosen = (relevant.length > 0 ? relevant.slice(0, 3) : sentences.slice(0, 3)).join(' ');
        response += `> ${chosen || bestChunk.content.slice(0, 300)}\n\n`;
        response += `*Source: **${dName}** [Page ${bestChunk.page_number}]*\n\n`;
      }
    } else {
      const topChunk = chunks[0];
      const docTitle = topChunk?.document_name || documentScopeName;
      const sentences = (topChunk?.content || '')
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 15);

      const relevant = sentences.filter((s) =>
        queryKeywords.some((kw) => s.toLowerCase().includes(kw))
      );

      const chosen = (relevant.length > 0 ? relevant.slice(0, 4) : sentences.slice(0, 4)).join('\n\n> ');

      response += `> ${chosen || topChunk?.content || 'Relevant material found.'}\n\n`;
      response += `*Referenced directly from **${docTitle}** [Page ${topChunk?.page_number || 1}].*`;
    }

    return response;
  }
}

export const aiService = new AIService();

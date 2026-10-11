import { DocumentChunkRecord } from '../types';

export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', "aren't", 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', "can't", 'cannot', 'could',
  "couldn't", 'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has',
  "hasn't", 'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her',
  'here', "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's",
  'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it',
  "it's", 'its', 'itself', "let's", 'me', 'more', 'most', "mustn't", 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', "shan't",
  'she', "she'd", "she'll", "she's", 'should', "shouldn't", 'so', 'some', 'such',
  'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've",
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  "wasn't", 'we', "we'd", "we'll", "we're", "we've", 'were', "weren't", 'what',
  "what's", 'when', "when's", 'where', "where's", 'which', 'while', 'who', "who's",
  'whom', 'why', "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd",
  "you'll", "you're", "you've", 'your', 'yours', 'yourself', 'yourselves',
  'tell', 'explain', 'describe', 'give', 'please', 'can', 'find', 'show',
  'document', 'this', 'uploaded', 'material', 'notes'
]);

export const GENERIC_SUMMARY_KEYWORDS = new Set([
  'summarize', 'summary', 'overview', 'revision', 'topics', 'exam',
  'brief', 'outline', 'concepts', 'important', 'all'
]);

export function cleanQuery(query: string): string[] {
  if (!query) return [];
  const cleaned = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
  const filtered = tokens.filter((t) => !STOP_WORDS.has(t));
  return filtered.length > 0 ? filtered : tokens;
}

export function retrieveChunks(
  chunks: DocumentChunkRecord[],
  query: string,
  topK: number = 4
): {
  id: number;
  chunk_index: number;
  page_number: number;
  content: string;
  score: number;
}[] {
  if (!chunks || chunks.length === 0) return [];
  if (chunks.length <= topK) {
    return chunks.map((c) => ({
      id: c.id,
      chunk_index: c.chunk_index,
      page_number: c.page_number,
      content: c.content,
      score: 1.0,
    }));
  }

  const keywords = cleanQuery(query);
  const lowerQuery = query.toLowerCase();
  const isBroadQuery = Array.from(GENERIC_SUMMARY_KEYWORDS).some((w) =>
    lowerQuery.includes(w)
  );

  const totalChunks = chunks.length;
  const chunkWords: string[][] = [];
  const chunkTextLower: string[] = [];

  for (const chunk of chunks) {
    const text = chunk.content.toLowerCase();
    chunkTextLower.push(text);
    const tokens = text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    chunkWords.push(tokens);
  }

  const df: Record<string, number> = {};
  for (const kw of keywords) {
    df[kw] = chunkWords.filter((words) => words.includes(kw)).length;
  }

  const scores: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunkTextLower[i];
    const words = chunkWords[i];
    const wordCount = words.length || 1;
    let score = 0.0;

    if (keywords.length > 1 && chunkText.includes(keywords.join(' '))) {
      score += 3.0;
    }

    for (const kw of keywords) {
      const tf = words.filter((w) => w === kw).length;
      if (tf > 0) {
        const docFreq = df[kw] || 1;
        const icf = Math.log((totalChunks + 1) / (docFreq + 1)) + 1.0;
        const normTf = (tf * 2.0) / (tf + 1.2 * (0.25 + 0.75 * (wordCount / 100)));
        score += normTf * icf;
      }
    }

    if (isBroadQuery) {
      if (i === 0) score += 1.5;
      else if (i === 1) score += 1.0;
    }

    scores.push(score);
  }

  const maxScore = Math.max(...scores, 0);

  if (maxScore <= 0 || isBroadQuery) {
    const step = Math.max(1, Math.floor(totalChunks / topK));
    const selectedIndices = Array.from({ length: topK }, (_, i) =>
      Math.min(i * step, totalChunks - 1)
    );
    const uniqueIndices = Array.from(new Set(selectedIndices)).sort((a, b) => a - b);
    return uniqueIndices.map((idx) => ({
      id: chunks[idx].id,
      chunk_index: chunks[idx].chunk_index,
      page_number: chunks[idx].page_number,
      content: chunks[idx].content,
      score: Math.round(Math.max(0.5, scores[idx]) * 1000) / 1000,
    }));
  }

  const scoredPairs = chunks.map((chunk, idx) => ({
    chunk,
    score: scores[idx],
  }));

  scoredPairs.sort((a, b) => b.score - a.score);
  const top = scoredPairs.slice(0, topK);

  return top.map((item) => ({
    id: item.chunk.id,
    chunk_index: item.chunk.chunk_index,
    page_number: item.chunk.page_number,
    content: item.chunk.content,
    score: Math.round(item.score * 1000) / 1000,
  }));
}

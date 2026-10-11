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
  'it\'s', 'its', 'itself', "let's", 'me', 'more', 'most', "mustn't", 'my',
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
  'document', 'pdf', 'pdfs', 'uploaded', 'material', 'notes', 'questions', 'question'
]);

export const GENERIC_SUMMARY_KEYWORDS = new Set([
  'summarize', 'summary', 'overview', 'revision', 'outline', 'brief'
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
  topK: number = 8
): (DocumentChunkRecord & { score: number })[] {
  if (!chunks || chunks.length === 0) return [];
  if (chunks.length <= topK) {
    return chunks.map((c) => ({
      ...c,
      score: 1.0,
    }));
  }

  const keywords = cleanQuery(query);
  const lowerQuery = query.toLowerCase();
  const isPureSummary = Array.from(GENERIC_SUMMARY_KEYWORDS).some((w) =>
    lowerQuery.includes(w)
  ) && keywords.length <= 2;

  const totalChunks = chunks.length;
  const chunkWords: string[][] = [];
  const chunkTextLower: string[] = [];

  for (const chunk of chunks) {
    const text = chunk.content.toLowerCase();
    chunkTextLower.push(text);
    const tokens = text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    chunkWords.push(tokens);
  }

  // Document Frequency calculation across chunk corpus
  const df: Record<string, number> = {};
  for (const kw of keywords) {
    df[kw] = chunkWords.filter((words) => words.includes(kw)).length;
  }

  const scores: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkText = chunkTextLower[i];
    const words = chunkWords[i];
    const wordCount = words.length || 1;
    let score = 0.0;

    // Check if document name matches query terms
    const docNameLower = (chunk.document_name || '').toLowerCase();
    for (const kw of keywords) {
      if (docNameLower.includes(kw)) {
        score += 2.5;
      }
    }

    // Exact multi-word phrase matching
    if (keywords.length > 1 && chunkText.includes(keywords.join(' '))) {
      score += 4.0;
    }

    // BM25 / TF-ICF keyword scoring
    for (const kw of keywords) {
      const tf = words.filter((w) => w === kw).length;
      if (tf > 0) {
        const docFreq = df[kw] || 1;
        const icf = Math.log((totalChunks + 1) / (docFreq + 1)) + 1.0;
        const normTf = (tf * 2.0) / (tf + 1.2 * (0.25 + 0.75 * (wordCount / 100)));
        score += normTf * icf;
      }
    }

    scores.push(score);
  }

  const maxScore = Math.max(...scores, 0);

  // If pure summary or zero keyword matches across all chunks
  if (maxScore <= 0 || isPureSummary) {
    // Group chunks by document to ensure multi-document representation
    const byDoc: Record<string, DocumentChunkRecord[]> = {};
    for (const chunk of chunks) {
      const key = String(chunk.document_id || 'default');
      if (!byDoc[key]) byDoc[key] = [];
      byDoc[key].push(chunk);
    }

    const docKeys = Object.keys(byDoc);
    const result: (DocumentChunkRecord & { score: number })[] = [];
    const perDocCount = Math.max(1, Math.floor(topK / docKeys.length));

    for (const key of docKeys) {
      const docChunks = byDoc[key];
      // Pick first overview chunk and spaced chunks
      const picked = docChunks.slice(0, perDocCount);
      for (const p of picked) {
        result.push({
          ...p,
          score: 0.85,
        });
      }
    }

    // Fill remaining up to topK
    if (result.length < topK) {
      for (const c of chunks) {
        if (!result.some((r) => r.id === c.id)) {
          result.push({ ...c, score: 0.75 });
          if (result.length >= topK) break;
        }
      }
    }

    return result.slice(0, topK);
  }

  // Rank by relevance score
  const scoredPairs = chunks.map((chunk, idx) => ({
    chunk,
    score: scores[idx],
  }));

  scoredPairs.sort((a, b) => b.score - a.score);

  // Diversity aware selection: ensure multiple documents get represented if they score well
  const top: { chunk: DocumentChunkRecord; score: number }[] = [];
  const docCounts: Record<string, number> = {};
  const maxPerDoc = Math.max(3, Math.ceil(topK / 2));

  // First pass: add top candidates respecting per-doc diversity cap
  for (const item of scoredPairs) {
    if (item.score <= 0) break;
    const docKey = String(item.chunk.document_id || 'default');
    const current = docCounts[docKey] || 0;
    if (current < maxPerDoc) {
      top.push(item);
      docCounts[docKey] = current + 1;
      if (top.length >= topK) break;
    }
  }

  // Second pass: fill remainder if needed
  if (top.length < topK) {
    for (const item of scoredPairs) {
      if (!top.some((t) => t.chunk.id === item.chunk.id)) {
        top.push(item);
        if (top.length >= topK) break;
      }
    }
  }

  return top.map((item) => ({
    ...item.chunk,
    score: Math.round(item.score * 1000) / 1000,
  }));
}

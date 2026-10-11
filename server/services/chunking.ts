export function cleanText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  const lines = text.split('\n').map((l) => l.trim());
  return lines.join('\n').trim();
}

export function chunkText(
  text: string,
  chunkSize: number = 600,
  chunkOverlap: number = 100
): { chunk_index: number; content: string; page_number: number }[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];

  const pagePattern = /---\s*Page\s+(\d+)\s*---/gi;
  const segments = cleaned.split(pagePattern);

  const rawChunks: { content: string; page_number: number }[] = [];
  let currentPage = 1;

  function splitIntoWindows(sectionText: string, pageNum: number) {
    const paragraphs = sectionText.split('\n\n').filter((p) => p.trim());
    let buffer = '';

    for (const para of paragraphs) {
      if (buffer && buffer.length + para.length + 2 > chunkSize) {
        rawChunks.push({
          content: buffer.trim(),
          page_number: pageNum,
        });
        const overlapText =
          buffer.length > chunkOverlap ? buffer.slice(-chunkOverlap) : buffer;
        buffer = overlapText + '\n\n' + para;
      } else {
        buffer = buffer ? buffer + '\n\n' + para : para;
      }

      while (buffer.length > chunkSize * 1.5) {
        let splitPoint = buffer.lastIndexOf('. ', chunkSize);
        if (splitPoint === -1 || splitPoint < chunkSize / 2) {
          splitPoint = chunkSize;
        } else {
          splitPoint += 1;
        }

        const chunkSlice = buffer.slice(0, splitPoint).trim();
        if (chunkSlice) {
          rawChunks.push({
            content: chunkSlice,
            page_number: pageNum,
          });
        }
        buffer = buffer.slice(Math.max(0, splitPoint - chunkOverlap)).trim();
      }
    }

    if (buffer.trim()) {
      rawChunks.push({
        content: buffer.trim(),
        page_number: pageNum,
      });
    }
  }

  if (segments.length > 1) {
    if (segments[0].trim()) {
      splitIntoWindows(segments[0].trim(), currentPage);
    }
    let idx = 1;
    while (idx < segments.length) {
      const parsedPage = parseInt(segments[idx].trim(), 10);
      currentPage = !isNaN(parsedPage) ? parsedPage : currentPage + 1;
      const content = idx + 1 < segments.length ? segments[idx + 1] : '';
      if (content.trim()) {
        splitIntoWindows(content.trim(), currentPage);
      }
      idx += 2;
    }
  } else {
    splitIntoWindows(cleaned, 1);
  }

  return rawChunks.map((chunk, i) => ({
    chunk_index: i,
    content: chunk.content,
    page_number: chunk.page_number || 1,
  }));
}

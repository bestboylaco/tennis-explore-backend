export function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];

  if (!text || typeof text !== "string") {
    return chunks;
  }

  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    start += chunkSize - overlap;
  }

  return chunks;
}
export function generateDocumentId() {
  return `doc_${Date.now()}`;
}

export function generateChunkId(documentId, chunkIndex) {
  return `${documentId}_chunk_${chunkIndex}`;
}
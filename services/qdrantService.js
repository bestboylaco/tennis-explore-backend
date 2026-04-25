import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  host: "localhost",
  port: 6333,
});

const COLLECTION_NAME = "tennis_chunks";

// Call this once before uploading/searching.
export async function ensureQdrantCollection(vectorSize) {
  const collections = await client.getCollections();
  const exists = collections.collections?.some(
    (c) => c.name === COLLECTION_NAME
  );

  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });
  }
}

export async function upsertChunkPoints(chunks) {
  if (!chunks.length) return;

  const points = chunks.map((chunk, index) => ({
    id: index + 1 + Date.now(),
    vector: chunk.embedding,
    payload: {
      chunk_id: chunk.chunk_id,
      chunk_index: chunk.chunk_index,
      text: chunk.text,
      metadata: chunk.metadata,
    },
  }));

  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });
}

export async function searchQdrant(questionEmbedding, limit = 10) {
  const result = await client.search(COLLECTION_NAME, {
    vector: questionEmbedding,
    limit,
    with_payload: true,
  });

  return result.map((item) => ({
    score: item.score,
    text: item.payload?.text || "",
    metadata: item.payload?.metadata || {},
    chunk_id: item.payload?.chunk_id || null,
    chunk_index: item.payload?.chunk_index || null,
  }));
}
import fs from "fs/promises";
import path from "path";

const processedDir = path.resolve("processed");

export async function loadAllProcessedDocuments() {
  const files = await fs.readdir(processedDir);

  const docs = [];

  for (const file of files) {
    if (file.endsWith(".json")) {
      const filePath = path.join(processedDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      docs.push(parsed);
    }
  }

  return docs;
}

export function getAllChunks(processedDocs) {
  const allChunks = [];

  for (const doc of processedDocs) {
    for (const chunk of doc.chunks) {
      allChunks.push({
        text: chunk.text,
        metadata: chunk.metadata,
      });
    }
  }

  return allChunks;
}
import { listByPrefix, getFileContent } from "./s3Service.js";

export async function getStructuredDataForQuestion(question) {
  const files = await listByPrefix("raw/match-stats/");

  if (!files || files.length === 0) {
    return [];
  }

  const firstFile = files[0];

  const content = await getFileContent(firstFile.key);

  return {
    source: firstFile.key,
    preview: typeof content === "string" ? content.slice(0, 2000) : content,
    note: "This is temporary structured retrieval from S3. Later this should query MongoDB or PostgreSQL."
  };
}
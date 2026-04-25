import path from "path";
import { extractTextFromFile } from "./extractTextService.js";
import { cleanText } from "../utils/cleanText.js";
import { chunkText } from "../utils/chunker.js";
import { generateDocumentId, generateChunkId } from "../utils/idGenerator.js";
import { saveProcessedDocument } from "./processedStoreService.js";
import { embedText } from "../utils/embedding.js";
import { ensureQdrantCollection, upsertChunkPoints } from "./qdrantService.js";
import { detectDocumentType } from "./documentClassifierService.js";
import { processJournalArticleText } from "./journalProcessingService.js";

export async function ingestDocument(file) {
  const documentId = generateDocumentId();
  const fileType = path.extname(file.originalname).replace(".", "").toLowerCase();

  const rawText = await extractTextFromFile(file.path, file.originalname);

  if (!rawText || !rawText.trim()) {
    throw new Error("No text could be extracted from this file");
  }

  const documentType = detectDocumentType(rawText, file.originalname);

  let processedText = rawText;

  if (documentType === "journal_article") {
    processedText = processJournalArticleText(rawText);
  }

  const cleanedText = cleanText(processedText);

  if (!cleanedText) {
    throw new Error("No usable text remained after cleaning");
  }

  const rawChunks = chunkText(cleanedText).filter(
    (chunk) => chunk && chunk.trim().length > 40
  );

  const documentMetadata = {
  document_id: documentId,
  file_name: file.originalname,
  file_type: fileType,
  document_type: documentType,

  // 🔥 NEW FIELDS (Stage 4 upgrade)
  source_category: getSourceCategory(fileType),
  content_length: cleanedText.length,
  ingestion_stage: "stage_4",

  source_path: file.path,
  uploaded_at: new Date().toISOString(),

  raw_text_length: rawText.length,
  cleaned_text_length: cleanedText.length,
};

  const chunks = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const text = rawChunks[i];
    const embedding = await embedText(text);

    chunks.push({
      chunk_id: generateChunkId(),
      chunk_index: i,
      text,
      embedding,
      metadata: {
        ...documentMetadata,
        chunk_index: i,
      },
    });
  }

  if (chunks.length > 0) {
    await ensureQdrantCollection(chunks[0].embedding.length);
    await upsertChunkPoints(chunks);
  }

  const processedFile = await saveProcessedDocument({
    document: documentMetadata,
    full_text: cleanedText,
    chunks,
  });

  return {
    document: documentMetadata,
    chunks,
    processed_file: processedFile,
  };
}

function getSourceCategory(fileType) {
  if (["csv", "xlsx", "xls"].includes(fileType)) {
    return "structured_data";
  }

  if (["pptx"].includes(fileType)) {
    return "presentation";
  }

  if (["pdf", "docx"].includes(fileType)) {
    return "document";
  }

  if (["txt", "md", "json"].includes(fileType)) {
    return "text";
  }

  return "unknown";
}
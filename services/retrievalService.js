import { embedText } from "../utils/embedding.js";
import { searchQdrant } from "./qdrantService.js";

function normalizeText(text = "") {
  return String(text).toLowerCase().trim();
}

function scoreChunkHeuristics(chunkText = "", question = "") {
  const text = normalizeText(chunkText);
  const q = normalizeText(question);

  let bonus = 0;

  const performanceTerms = [
    "weakness",
    "weaknesses",
    "improve",
    "improvement",
    "under pressure",
    "pressure",
    "fatigue",
    "late in matches",
    "second serve",
    "double faults",
    "return",
    "backhand",
    "forehand",
    "errors",
    "inconsistency",
    "instability",
    "decline",
    "performance",
    "recommendation",
    "coach",
    "training",
  ];

  const researchTerms = [
    "study",
    "research",
    "findings",
    "results",
    "observed",
    "reported",
    "conclusion",
  ];

  const matchedPerformanceTerms = performanceTerms.filter(
    (term) => text.includes(term) && q.includes(term)
  ).length;

  const matchedResearchTerms = researchTerms.filter(
    (term) => text.includes(term) && q.includes(term)
  ).length;

  bonus += matchedPerformanceTerms * 0.03;
  bonus += matchedResearchTerms * 0.02;

  // Small bonus for chunks that look more content-rich
  if (text.length > 250) {
    bonus += 0.02;
  }

  // Small penalty for very short / generic chunks
  if (text.length < 80) {
    bonus -= 0.03;
  }

  return bonus;
}

function rerankChunks(chunks = [], question = "") {
  return chunks
    .map((chunk) => {
      const heuristicBonus = scoreChunkHeuristics(chunk.text || "", question);
      const finalScore = (chunk.score || 0) + heuristicBonus;

      return {
        ...chunk,
        rerank_score: finalScore,
      };
    })
    .sort((a, b) => b.rerank_score - a.rerank_score);
}

function dedupeChunksByText(chunks = []) {
  const seen = new Set();
  const result = [];

  for (const chunk of chunks) {
    const key = normalizeText(chunk.text || "").slice(0, 180);

    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(chunk);
  }

  return result;
}

function diversifyByFile(chunks = [], maxPerFile = 2) {
  const fileCounts = new Map();
  const result = [];

  for (const chunk of chunks) {
    const fileName = chunk.metadata?.file_name || "unknown";
    const count = fileCounts.get(fileName) || 0;

    if (count < maxPerFile) {
      result.push(chunk);
      fileCounts.set(fileName, count + 1);
    }
  }

  return result;
}

export async function retrieveRelevantChunks(question, topK = 8) {
  const questionEmbedding = await embedText(question);
  const retrieved = await searchQdrant(questionEmbedding, topK);

  return rerankChunks(retrieved, question);
}

export async function buildContextFromProcessedChunks(
  question,
  topK = 5,
  minScore = 0.45
) {
  const retrievedChunks = await retrieveRelevantChunks(question, Math.max(topK, 8));

  const filteredChunks = retrievedChunks.filter(
    (chunk) =>
      (chunk.rerank_score ?? chunk.score ?? 0) >= minScore &&
      chunk.text &&
      chunk.text.trim().length > 40
  );

  const dedupedChunks = dedupeChunksByText(filteredChunks);
  const diversifiedChunks = diversifyByFile(dedupedChunks, 2);
  const finalChunks = diversifiedChunks.slice(0, topK);

  const combinedContext = finalChunks
    .map(
      (item, index) => `
  [Source ${index + 1}]
  File: ${item.metadata?.file_name || "unknown"}
  Score: ${typeof item.rerank_score === "number" ? item.rerank_score.toFixed(3) : item.score}

  ${item.text}
  `
    )
    .filter(Boolean)
    .join("\n\n");

  console.log("🔥 FINAL CONTEXT:\n", combinedContext);

  return {
    topChunks: finalChunks,
    combinedContext,
  };
}
// services/documentClassifierService.js

export function detectDocumentType(text, fileName = "") {
  const lowerText = text.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  const journalSignals = [
    "abstract",
    "introduction",
    "methods",
    "results",
    "discussion",
    "conclusion",
    "references",
    "doi",
    "journal",
    "study",
    "participants",
    "statistical analysis",
  ];

  const coachingSignals = [
    "training report",
    "coach notes",
    "player observations",
    "recommendation",
    "weakness",
    "strength",
    "session summary",
    "match analysis",
  ];

  const journalScore = journalSignals.filter((s) => lowerText.includes(s)).length;
  const coachingScore = coachingSignals.filter((s) => lowerText.includes(s)).length;

  if (lowerFileName.endsWith(".pdf") && journalScore >= coachingScore && journalScore >= 3) {
    return "journal_article";
  }

  return "general_report";
}
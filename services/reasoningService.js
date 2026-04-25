export function buildReasoningContext({
  question = "",
  structuredAnswer = "",
  finalChunks = [],
  weaknessReport = { summary: "No weakness signals found.", items: [] },
}) {
  finalChunks = Array.isArray(finalChunks) ? finalChunks : [];

  weaknessReport = weaknessReport || {
    summary: "No weakness signals found.",
    items: [],
  };

  weaknessReport.items = Array.isArray(weaknessReport.items)
    ? weaknessReport.items
    : [];

  const evidenceText = finalChunks.length
    ? finalChunks
        .map((chunk, index) => {
          const file = chunk.metadata?.file_name || "unknown";
          const score = chunk.score ?? "unknown";
          const text = chunk.text || "No text available";

          return `
Evidence ${index + 1}
Source: ${file}
Score: ${score}
Text: ${text}
`;
        })
        .join("\n")
    : "No unstructured evidence found.";

  const weaknessText = weaknessReport.items.length
    ? weaknessReport.items
        .map((item, index) => {
          return `
Weakness ${index + 1}
Area: ${item.label || "unknown"}
Recommendation: ${item.recommendation || "No recommendation available"}
Evidence: ${item.evidence || "No evidence available"}
Source: ${item.source || "unknown"}
`;
        })
        .join("\n")
    : "No weakness signals detected.";

  return `
User question:
${question}

Structured performance data:
${structuredAnswer || "No structured data available."}

Retrieved evidence:
${evidenceText}

Detected weaknesses:
${weaknessText}

Task:
- Identify the main performance issue
- Connect evidence across sources
- Explain WHY the issue occurs
- Provide practical coaching recommendations
- Keep answer focused and performance-driven
`;
}
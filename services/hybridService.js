// services/hybridService.js

import { askAI } from "./aiService.js";

function formatSignals(title, data) {
  if (!data?.found) return `${title}: None`;

  return `${title}:\n` +
    data.signals.map((s, i) => `${i + 1}. ${s.text}`).join("\n");
}

export async function generateHybridAnswer({
  question,
  structured,
  unstructured
}) {
  const prompt = `
You are a professional tennis coach AI.

Answer ONLY using the evidence below.

If evidence is weak, say "insufficient data".

Question:
${question}

${formatSignals("Structured Evidence", structured)}

${formatSignals("Report Evidence", unstructured)}

Provide:
1. Direct answer
2. Key weaknesses (if any)
3. Coaching recommendation
4. Confidence (High/Medium/Low)
`;

  return await askAI(prompt);
}
import fs from "fs";

const TEXT_MODEL = "phi3";
const VISION_MODEL = "llama3.2-vision:11b";

export async function askAI(question, context) {
  const prompt = `You are TennisExplore, a friendly tennis coach assistant.

Answer the question clearly and practically using short Markdown sections (headings, bullets, bold text). Do not mention "context" or "data" - just answer naturally. If the information below is not relevant, answer using general tennis coaching knowledge instead.

Information:
${context}

Question: ${question}

Answer:`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.45,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama request failed: ${errText}`);
  }

  const data = await response.json();
  return (data.response || "").trim();
}

export async function askVisionAI(imagePath, prompt) {
  const imageBase64 = fs.readFileSync(imagePath, "base64");

  const visionPrompt = `
You are TennisExplore, an elite tennis coach.

Analyse this tennis image and identify the MOST IMPORTANT technical issue.

Focus on:
- Body position
- Balance
- Racket preparation
- Contact point
- Follow-through

Rules:
- Do NOT describe everything.
- Identify ONLY 1–2 key weaknesses.
- Be direct and practical like a coach.
- No long explanations.
- If unclear, say what cannot be seen clearly.
- Do not guess the player identity.
- Do not use JSON.
- Use Markdown.

${prompt ? `Extra user instruction:\n${prompt}` : ""}

Return in this format:

🎾 **Key Issue**
- ...

🎯 **Why it matters**
- ...

🏆 **Fix**
- ...

🔥 **Drill**
- ...
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      prompt,
      images: [imageBase64],
      stream: false,
      options: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama vision request failed: ${errText}`);
  }

  const data = await response.json();
  return (data.response || "").trim();
}
import fs from "fs";

const TEXT_MODEL = "phi3";
const VISION_MODEL = "llama3.2-vision:11b";

export async function askAI(question, context) {
  const prompt = `
You are TennisExplore, a friendly high-performance tennis coach.

Answer like ChatGPT: clear, structured, practical, and easy to read.

Rules:
- If the question is general tennis advice, answer using general coaching knowledge.
- If uploaded evidence is relevant, use it.
- If uploaded evidence is unrelated, ignore it.
- Do not mention "context", "provided text", or "data".
- Do not use JSON.
- Use Markdown headings, bullets, bold text, and short sections.
- Be practical and coach-like.
- Give examples and a simple practice plan when useful.

For beginner questions, use this format:

🎾 **Quick overview**

## 1. Understand the game
- ...

## 2. Grip + ready position
- ...

## 3. Footwork
- ...

## 4. Basic shots
### Forehand
- ...

### Backhand
- ...

### Serve
- ...

## 5. First practice plan
- ...

⚠️ **Common mistakes**
- ...

💡 **How to improve faster**
- ...

Information available:
${context}

User question:
${question}

Answer:
`;

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
import axios from "axios";

export async function askOllama(prompt) {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: process.env.OLLAMA_MODEL || "llama3.1:8b",
      prompt,
      stream: false,
    });

    return response.data.response || "No response from Ollama.";
  } catch (error) {
    console.error("OLLAMA ERROR:", error.message);
    throw new Error("Failed to get response from Ollama.");
  }
}

export async function answerStructuredQuestion(question, data) {
  const prompt = `
You are a tennis analytics assistant.
Answer the user's question using only the structured data below.

Question:
${question}

Structured data:
${JSON.stringify(data, null, 2)}

Rules:
- Be clear and professional.
- If the data is empty, say you could not find enough structured data.
- Do not invent information.
`;

  return askOllama(prompt);
}

export async function answerDocumentQuestion(question, chunks) {
  const context = chunks?.length
    ? chunks.map((chunk, index) => `Chunk ${index + 1}: ${chunk}`).join("\n\n")
    : "No relevant document context found.";

  const prompt = `
You are a tennis knowledge assistant.
Answer the user's question using only the context below.

Question:
${question}

Context:
${context}

Rules:
- Be clear and grounded in the provided context.
- If the answer is not present, say you could not find enough evidence.
- Do not make up facts.
`;

  return askOllama(prompt);
}

export async function answerHybridQuestion(question, structuredData, documentChunks) {
  const context = documentChunks?.length
    ? documentChunks.map((chunk, index) => `Chunk ${index + 1}: ${chunk}`).join("\n\n")
    : "No document context found.";

  const prompt = `
You are a tennis assistant.
Answer the user's question using the structured data and document context below.

Question:
${question}

Structured data:
${JSON.stringify(structuredData, null, 2)}

Document context:
${context}

Rules:
- Combine both sources carefully.
- If something is missing, say so.
- Do not invent facts.
`;

  return askOllama(prompt);
}
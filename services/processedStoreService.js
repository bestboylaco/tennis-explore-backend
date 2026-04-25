import fs from "fs/promises";
import path from "path";

const processedDir = path.resolve("processed");

export async function saveProcessedDocument(data) {
  await fs.mkdir(processedDir, { recursive: true });

  const fileName = data?.document?.file_name || "unknown.txt";

  const safeName = fileName.replace(/\.[^/.]+$/, "").replace(/[^\w\-]+/g, "_");
  const outputPath = path.join(processedDir, `${safeName}.processed.json`);

  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf-8");

  return outputPath;
}
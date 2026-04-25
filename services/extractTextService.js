import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import XLSX from "xlsx";
import PPTX2Json from "pptx2json";

// Import worker FIRST
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

    export async function extractTextFromFile(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();

    if (ext === ".txt" || ext === ".json" || ext === ".md" || ext === ".csv") {
        return extractTxtText(filePath);
    }

    if (ext === ".pdf") {
        return extractPdfText(filePath);
    }

    if (ext === ".docx") {
        return extractDocxText(filePath);
    }

    if (ext === ".xlsx" || ext === ".xls") {
        return extractExcelText(filePath);
    }

  if (ext === ".pptx") {
    return extractPptxText(filePath);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

async function extractTxtText(filePath) {
  return await fs.readFile(filePath, "utf-8");
}

async function extractPdfText(filePath) {
  const buffer = await fs.readFile(filePath);

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();

  return result.text || "";
}

async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
}

async function extractExcelText(filePath) {
  const workbook = XLSX.readFile(filePath);
  let output = "";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });

    output += `\n[Sheet: ${sheetName}]\n`;

    for (const row of rows) {
      const rowText = row
        .map((cell) => String(cell).trim())
        .filter(Boolean)
        .join(" | ");

      if (rowText) {
        output += rowText + "\n";
      }
    }
  }

  return output.trim();
}

async function extractPptxText(filePath) {
  const parser = new PPTX2Json();
  const result = await parser.toJson(filePath);

  if (!result) return "";

  const collectedTexts = [];

  function isUsefulText(text) {
    const cleaned = text.trim();

    if (cleaned.length < 3) return false;

    const junkPatterns = [
      "/ppt/",
      ".xml",
      "application/vnd.",
      "openxmlformats",
      "slideLayout",
      "theme",
      "notesSlide",
      "notesMaster",
      "presProps",
      "viewProps",
      "tableStyles",
      "ppt/",
      "_rels",
      "content_types",
    ];

    return !junkPatterns.some((junk) =>
      cleaned.toLowerCase().includes(junk.toLowerCase())
    );
  }

  function collectStrings(value) {
    if (!value) return;

    if (typeof value === "string") {
      const cleaned = value.trim();

      if (isUsefulText(cleaned)) {
        collectedTexts.push(cleaned);
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collectStrings);
      return;
    }

    if (typeof value === "object") {
      Object.values(value).forEach(collectStrings);
    }
  }

  collectStrings(result);

  return [...new Set(collectedTexts)].join("\n").trim();
}
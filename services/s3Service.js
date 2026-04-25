import s3 from "../s3.js";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { parse } from "csv-parse/sync";
import XLSX from "xlsx";
export async function listByPrefix(prefix) {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: prefix,
  });

  const data = await s3.send(command);

  return (data.Contents || []).map((item) => ({
    key: item.Key,
    size: item.Size,
    lastModified: item.LastModified,
    storageClass: item.StorageClass,
  }));
}

export async function getFileContent(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  const data = await s3.send(command);

  const chunks = [];
  for await (const chunk of data.Body) {
    chunks.push(chunk);
  }

  const content = Buffer.concat(chunks).toString("utf-8");

  if (key.endsWith(".json")) {
    return JSON.parse(content);
  }

  if (key.endsWith(".csv")) {
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
    });
  }

  return content;
}

// 👇 ADD THIS NEW FUNCTION HERE
export async function getStructuredFileData(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  const data = await s3.send(command);

  const chunks = [];
  for await (const chunk of data.Body) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const ext = key.split(".").pop().toLowerCase();

  // CSV structured data
  if (ext === "csv") {
    const content = buffer.toString("utf-8");

    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  // Excel structured data
  if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return [];
    }

    const sheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });
  }

  return [];
}



export function summarizeContent(content) {
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return "CSV file is empty.";
    }

    let summary = `This CSV file contains ${content.length} row(s). `;

    content.forEach((row, index) => {
      if ("match_id" in row && "player" in row && "score" in row) {
        summary += `Match ${row.match_id}: ${row.player} recorded score ${row.score}. `;
      } else {
        summary += `Row ${index + 1} contains ${Object.keys(row).join(", ")}. `;
      }
    });

    return summary;
  }

  if (typeof content === "object" && content !== null) {
    return `JSON file with ${Object.keys(content).length} field(s).`;
  }

  if (typeof content === "string") {
    return `Text file with ${content.length} character(s).`;
  }

  return "Unknown file type.";
}

export function generateSimpleAnswer(query, content) {
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return `I found a CSV file for "${query}", but it has no rows.`;
    }

    const firstRow = content[0];
    const keys = Object.keys(firstRow);

    return `I found a CSV file for "${query}" with ${content.length} row(s). The first row contains: ${keys.join(", ")}.`;
  }

  if (typeof content === "object" && content !== null) {
    if ("name" in content && "ranking" in content && "country" in content) {
      return `${content.name} is ranked ${content.ranking} and represents ${content.country}.`;
    }

    return `I found a JSON file for "${query}" with ${Object.keys(content).length} field(s).`;
  }

  if (typeof content === "string") {
    return `I found a text file for "${query}".`;
  }

  return `I found data for "${query}".`;
}
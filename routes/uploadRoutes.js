import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ingestDocument } from "../services/ingestionService.js";

const router = express.Router();

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedExtensions = [
  ".txt",
  ".json",
  ".md",
  ".pdf",
  ".csv",
  ".docx",
  ".pptx",
  ".xlsx",
  ".xls",
  ".jpg",
  ".jpeg",
  ".png",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await ingestDocument(req.file);

    res.json({
      message: "File processed successfully",
      document_id: result.document.document_id,
      file_name: result.document.file_name,
      file_type: result.document.file_type,
      chunks_count: result.chunks.length,
      processed_file: result.processed_file,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({
      error: error.message || "Failed to process uploaded file",
    });
  }
});

export default router;
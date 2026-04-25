import express from "express";
import multer from "multer";
import fs from "fs";
import { askVisionAI } from "../services/aiService.js";

const router = express.Router();

// 📁 create upload folder if not exist
const uploadDir = "uploads/images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 📦 multer config
const upload = multer({
  dest: uploadDir,
});


// ===============================
// 🔹 SINGLE IMAGE (KEEP THIS)
// ===============================
router.post("/analyse", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const question = req.body.question || "";

    const prompt = `
You are a high-performance tennis coach.

The user uploaded a tennis image and asked this question:

"${question || "Analyse this image and identify the main technical weakness."}"

Analyse the image based on the user's question.

Focus on:
- body position
- balance
- footwork
- racket preparation
- contact point
- follow-through
- technical weakness
- practical coaching correction

Return:

🎾 **Answer**
- ...

🎯 **Key Issue**
- ...

🏆 **Fix**
- ...

🔥 **Drill**
- ...
`;

    const result = await askVisionAI(req.file.path, prompt);

    res.json({
      file: req.file.originalname,
      analysis: result,
    });

  } catch (err) {
    console.error("IMAGE ERROR:", err);
    res.status(500).json({
      error: "Image analysis failed",
      details: err.message,
    });
  }
});


// ===============================
// 🔥 ADD MULTI-IMAGE HERE
// ===============================
router.post("/analyse-multi", upload.array("files", 5), async (req, res) => {
  try {
    const files = req.files;
    const question = req.body.question || "";

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    const prompt = `
You are an elite tennis coach.

The user uploaded multiple images of a tennis stroke.

Question:
"${question || "Analyse these images and identify the main technical issue."}"

Analyse ALL images together as a sequence.

Focus on:
- movement pattern
- timing
- consistency
- repeated technical mistakes

Do NOT analyse each image separately.
Find ONE main pattern across all images.

Return:

🎾 Main Pattern
- ...

🎯 Why it matters
- ...

🏆 Fix
- ...

🔥 Drill
- ...
`;

    // 🔥 ADVANCED: combine all images in ONE call
    const imageBase64Array = files.map(file =>
      fs.readFileSync(file.path, "base64")
    );

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llava:7b",
        prompt,
        images: imageBase64Array,
        stream: false,
      }),
    });

    const data = await response.json();

    res.json({
      files: files.map(f => f.originalname),
      analysis: data.response,
    });

  } catch (err) {
    console.error("MULTI IMAGE ERROR:", err);
    res.status(500).json({
      error: "Multi image analysis failed",
      details: err.message,
    });
  }
});


export default router;
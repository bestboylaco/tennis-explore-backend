import express from "express";
import dotenv from "dotenv";
import imageRoutes from "./routes/imageRoutes.js";

import {
  listByPrefix,
  getFileContent,
  summarizeContent,
  getStructuredFileData,
} from "./services/s3Service.js";

import chatRoutes from "./routes/chatRoutes.js";

import uploadRoutes from "./routes/uploadRoutes.js"; // NEW 


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));
app.use("/image", imageRoutes);


app.use("/upload", uploadRoutes);



//All helper functions must be:

//outside routes
//above all app.get() and app.post()
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});


app.get("/files", async (req, res) => {
  try {
    const files = await listByPrefix("raw/");
    res.json(files);
  } catch (err) {
    console.error("FILES ERROR:", err);
    res.status(500).send(err.message || "Error fetching files");
  }
});

app.get("/match-stats", async (req, res) => {
  try {
    const files = await listByPrefix("raw/match-stats/");
    res.json(files);
  } catch (err) {
    console.error("MATCH STATS ERROR:", err);
    res.status(500).send(err.message || "Error fetching match stats");
  }
});
// 👇 ADD THIS BLOCK RIGHT HERE
app.get("/file-content", async (req, res) => {
  try {
    const key = req.query.key;

    if (!key) {
      return res.status(400).send("Missing key");
    }

    const content = await getFileContent(key);

    res.send(content);
  } catch (err) {
    console.error("FILE CONTENT ERROR:", err);
    res.status(500).send(err.message);
  }
});

app.get("/summary", async (req, res) => {
  try {
    const key = req.query.key;

    if (!key) {
      return res.status(400).send("Missing key");
    }

    const content = await getFileContent(key);

    const summary = await summarizeContent(content);

    res.send(summary);
  } catch (err) {
    console.error("SUMMARY ERROR:", err);
    res.status(500).send(err.message);
  }
});

app.get("/player-profiles", async (req, res) => {
  try {
    const files = await listByPrefix("raw/player-profiles/");
    res.json(files);
  } catch (err) {
    console.error("PLAYER PROFILES ERROR:", err);
    res.status(500).send(err.message || "Error fetching player profiles");
  }
});

app.get("/reports", async (req, res) => {
  try {
    const files = await listByPrefix("raw/reports/");
    res.json(files);
  } catch (err) {
    console.error("REPORTS ERROR:", err);
    res.status(500).send(err.message || "Error fetching reports");
  }
});


app.get("/file", async (req, res) => {
  try {
    const key = req.query.key;

    if (!key) {
      return res.status(400).json({ error: "Missing file key" });
    }

    const content = await getFileContent(key);
    res.json(content);
  } catch (err) {
    console.error("GET FILE ERROR:", err);
    res.status(500).send("Error reading file");
  }
});


app.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").toLowerCase().trim();

    if (!query) {
      return res.status(400).json({ error: "Missing search query" });
    }

    const files = await listByPrefix("raw/");

    const matches = files.filter((file) =>
      file.key.toLowerCase().includes(query) && !file.key.endsWith("/")
);

    res.json(matches);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).send("Error searching files");
  }
});

app.use("/chat", (req, res, next) => {
  console.log("🔥 /chat endpoint hit");
  next();
});

app.use("/chat", chatRoutes);


app.get("/mock-examples", (req, res) => {
  res.json({
    project: "TennisExplore MVP mock scenarios",
    examples: [
      {
        id: 1,
        title: "Coach prepares for an upcoming match",
        context:
          "A coach wants a quick player overview before training or competition.",
        question: "Who is Rafael Nadal?",
        expected_workflow: "unstructured",
        expected_data_source: [
          "raw/player-profiles/nadal.json"
        ],
        expected_output:
          "Name: Rafael Nadal, Country: Spain, Ranking: 2",
        business_value:
          "Saves time by providing instant player intelligence instead of manually opening files."
      },
      {
        id: 2,
        title: "Performance analyst reviews match statistics",
        context:
          "An analyst wants to check recent structured match data for a player.",
        question: "Show match stats for Nadal",
        expected_workflow: "structured",
        expected_data_source: [
          "raw/match-stats/sample_match_stats.csv"
        ],
        expected_output: [
          {
            match_id: "1",
            player: "Nadal",
            score: "6-4 6-4"
          }
        ],
        business_value:
          "Demonstrates how structured performance data can be queried directly and scaled into analytics dashboards."
      },
      {
        id: 3,
        title: "System combines multiple sources automatically",
        context:
          "A user wants a broader understanding of a player using all available sources.",
        question: "player profile nadal",
        expected_workflow: "unstructured",
        expected_data_source: [
          "raw/player-profiles/nadal.json",
          "raw/reports/nadal_report.txt"
        ],
        expected_output:
          "Name: Rafael Nadal, Country: Spain, Ranking: 2",
        business_value:
          "Shows multi-file retrieval and how fragmented tennis data can be unified into one answer."
      },
      {
        id: 4,
        title: "User asks a vague question",
        context:
          "A staff member does not know where the data lives and types a simple player name.",
        question: "nadal",
        expected_workflow: "unstructured",
        expected_data_source: [
          "raw/player-profiles/nadal.json",
          "raw/reports/..."
        ],
        expected_output:
          "Name: Rafael Nadal, Country: Spain, Ranking: 2",
        business_value:
          "Demonstrates intelligent retrieval and reduces the need for users to know the underlying folder structure."
      },
      {
        id: 5,
        title: "Future analytics vision",
        context:
          "A high-performance team wants trend-based insights across multiple matches.",
        question: "What are Nadal's recent performances?",
        expected_workflow: "structured",
        expected_data_source: [
          "raw/match-stats/*.csv"
        ],
        expected_output:
          "Nadal has won 3 out of his last 5 matches with strong straight-set performances.",
        business_value:
          "Shows how the MVP can evolve into full analytics using Athena-style querying and reporting."
      }
    ]
  });
});

app.get("/demo", (req, res) => {
  res.sendFile(process.cwd() + "/public/demo.html");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
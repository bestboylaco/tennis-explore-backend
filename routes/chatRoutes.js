  import express from "express";
  import {
    filterStructuredRows,
    buildStructuredAnswer,
    selectBestStructuredFile,
    detectWorkflow,
  } from "../services/routerService.js";
  import {
    buildContextFromProcessedChunks,
  } from "../services/retrievalService.js";
  import {
    getStructuredFileData,
    listByPrefix,
  } from "../services/s3Service.js";
  import { askAI } from "../services/aiService.js";
  import { buildWeaknessReportFromChunks } from "../services/weaknessDetectionService.js";
  import { buildReasoningContext } from "../services/reasoningService.js";
  import {
    generateVisualTags,
    retrieveVisuals
  } from "../services/visualService.js";
  const router = express.Router();


  function parseCoachingAnswer(answer) {
    if (!answer || answer.trim() === "Not found in data.") {
      return {
        raw: "Not found in data.",
        insight: null,
        evidence: null,
        weakness_detected: null,
        why_it_matters: null,
        recommendation: null,
        confidence: null,
      };
    }

    try {
      const parsed = JSON.parse(answer);

      if (parsed.not_found) {
        return {
          raw: "Not found in data.",
          insight: null,
          evidence: null,
          weakness_detected: null,
          why_it_matters: null,
          recommendation: null,
          confidence: null,
        };
      }

      return {
        raw: answer,
        insight: parsed.insight || null,
        evidence: parsed.evidence || null,
        weakness_detected: parsed.weakness_detected || null,
        why_it_matters: parsed.why_it_matters || null,
        recommendation: parsed.recommendation || null,
        confidence: parsed.confidence || null,
      };
    } catch (error) {
      return {
        raw: answer,
        insight: null,
        evidence: null,
        weakness_detected: null,
        why_it_matters: null,
        recommendation: null,
        confidence: null,
      };
    }
  }


  function emptyCoachingAnswer() {
    return {
      raw: "Not found in data.",
      insight: null,
      evidence: null,
      weakness_detected: null,
      why_it_matters: null,
      recommendation: null,
      confidence: null,
    };
  }

  router.post("/", async (req, res) => {
    console.log("🔥 NEW CHAT ROUTE RUNNING");

    try {
      const question = (req.body.question || "").trim();
      const normalizedQuestion = question.toLowerCase();

      console.log("QUESTION:", normalizedQuestion);

      if (!question) {
        return res.status(400).json({ error: "Missing question" });
      }

      const workflow = detectWorkflow(normalizedQuestion);

      const isResearchQuestion =
        normalizedQuestion.includes("study") ||
        normalizedQuestion.includes("research") ||
        normalizedQuestion.includes("journal") ||
        normalizedQuestion.includes("article") ||
        normalizedQuestion.includes("paper");

      const isReasonQuestion =
        normalizedQuestion.includes("reason") ||
        normalizedQuestion.includes("why") ||
        normalizedQuestion.includes("lost") ||
        normalizedQuestion.includes("loss") ||
        normalizedQuestion.includes("lose") ||
        normalizedQuestion.includes("defeat") ||
        normalizedQuestion.includes("cause");
      
      console.log("WORKFLOW IN chatRoutes:", workflow);

      let structuredAnswer = null;
      let structuredFile = null;

      let finalChunks = [];
      let finalContext = "";
      let weaknessReport = {
        summary: "No weakness signals found.",
        items: [],
      };

      // =========================
      // STRUCTURED PART
      // =========================
    if (workflow === "structured" || workflow === "hybrid" || workflow === "comparison") {
      // Structured workflow currently uses match-stats storage.
  // //Later we can expand this to include processed CSV/XLSX sources more explicitly.
      const files = await listByPrefix("raw/match-stats/");

      console.log("STRUCTURED FILES FOUND:", files.map((file) => file.key));

      if (files.length) {
        const bestMatch = selectBestStructuredFile(files, normalizedQuestion);

        if (!bestMatch) {
          structuredAnswer = null;
        } else {
          structuredFile = bestMatch.key;

          const rows = await getStructuredFileData(bestMatch.key);
          console.log("FIRST ROW:", rows[0]);
          console.log("RAW STRUCTURED ROWS:", rows);

          const filteredRows = filterStructuredRows(rows, normalizedQuestion);
          console.log("FILTERED ROWS:", filteredRows);
          console.log("ROWS PASSED TO ANSWER:", filteredRows.length);

          structuredAnswer = buildStructuredAnswer(filteredRows, normalizedQuestion);
          console.log("STRUCTURED ANSWER:", structuredAnswer);;
        }
    }
  }

      // =========================
      // UNSTRUCTURED PART
      // =========================
      if (workflow === "unstructured" || workflow === "hybrid" || workflow === "comparison") {
        const isComparisonQuestion =
          normalizedQuestion.includes("compare") ||
          normalizedQuestion.includes("difference") ||
          normalizedQuestion.includes("versus") ||
          normalizedQuestion.includes("vs");

        const topK = isComparisonQuestion ? 8 : 5;
        const minScore = isComparisonQuestion ? 0.4 : 0.45;

        const { topChunks, combinedContext } = await buildContextFromProcessedChunks(
          question,
          topK,
          minScore
        );

        if (topChunks.length) {
          const uniqueChunks = [];
          const seenFiles = new Set();

          for (const chunk of topChunks) {
            const fileName = chunk.metadata?.file_name || "unknown";

            if (!seenFiles.has(fileName)) {
              uniqueChunks.push(chunk);
              seenFiles.add(fileName);
            }
          }

          finalChunks = uniqueChunks.slice(0, isComparisonQuestion ? 6 : 4);

          const bestScore = finalChunks[0]?.score || 0;
          if (bestScore < 0.5) {
            return res.json({
              question,
              workflow,
              answer: "Not found in data.",
              coaching_answer: emptyCoachingAnswer(),
              weakness_report: weaknessReport,
              sources: [],
              top_chunks: [],
              
              // ✅ ADD HERE
              visualMeta: null,
              visuals: [],
            });
          }
          if (bestScore >= 0.4) {
            finalContext = finalChunks
              .map((chunk, index) => `Evidence ${index + 1}:\n${chunk.text || ""}`)
              .join("\n\n");
          }
        }

        // Always detect weakness signals from retrieved chunks
        weaknessReport = buildWeaknessReportFromChunks(finalChunks) || {
          summary: "No weakness signals found.",
          items: [],
        };
      }

      // =========================
      // STRUCTURED-ONLY RESPONSE
      // =========================
      if (workflow === "structured") {
        return res.json({
          question,
          workflow,
          matched_file: structuredFile,
          answer: structuredAnswer || "Not found in data.",
          coaching_answer: emptyCoachingAnswer(),
          weakness_report: weaknessReport,
          sources: [],
          top_chunks: [],
          // ✅ ADD HERE
          visualMeta: null,
          visuals: [],
        });
      }

      // =========================
      // UNSTRUCTURED-ONLY RESPONSE
      // =========================
      if (workflow === "unstructured") {
        if (!finalChunks.length) {
          return res.json({
            question,
            workflow,
            answer: "Not found in data.",
            top_chunks: [],
            sources: [],
            coaching_answer: emptyCoachingAnswer(),
            weakness_report: weaknessReport,
            // ✅ ADD HERE
            visualMeta: null,
            visuals: [],
          });
        }

        let contextForAI = buildReasoningContext({
          question,
          structuredAnswer: "",
          finalChunks,
          weaknessReport,
        });

        if (isResearchQuestion) {
          contextForAI += "\n\nTranslate research findings into practical coaching insights.";
        }
        if (isReasonQuestion) {
          contextForAI += `

        The user is asking for the reason behind a loss or poor performance.

        Answer by explaining:
        - the main cause of the loss
        - the weakness signals that support it
        - how those weaknesses affected the match outcome
        - what the player should improve next

        Do not list random weaknesses. Explain cause and effect based only on the evidence.
        `;
        }
        if (weaknessReport?.items?.length) {
          const weaknessSummary = weaknessReport.items
            .map(
              (w, index) =>
                `${index + 1}. Weakness: ${w.label}. Recommendation: ${w.recommendation}.`
            )
            .join("\n");

          contextForAI += `\n\nDetected weakness signals:\n${weaknessSummary}`;
        }

        const answer = await askAI(question, contextForAI);
        const parsedAnswer = parseCoachingAnswer(answer);

        // 🔥 Generate visual tags from question + AI answer
        const visualMeta = generateVisualTags(question, answer);

        // 🔥 Retrieve best matching images
        const visuals = retrieveVisuals(visualMeta);
        

        return res.json({
          question,
          workflow,
          

          // 🔹 Only show sources for unstructured/hybrid
          ...(workflow !== "structured" && {
            sources: finalChunks.map((item) => ({
              file: item.metadata?.file_name || "unknown",
              score: item.score,
            })),
            top_chunks: finalChunks.map((item) => ({
              file: item.metadata?.file_name || "unknown",
              score: item.score,
              preview: (item.text || "").slice(0, 150),
            })),
          }),

          // 🔹 Only show structured file when relevant
          ...(workflow === "structured" || workflow === "hybrid" || workflow === "comparison"
            ? { structured_file: structuredFile || null }
            : {}),

          answer,
          coaching_answer: parsedAnswer,
          weakness_report: weaknessReport,
          // ✅ ADD THESE
          visualMeta,
          visuals,

        });
      }
      // =========================
      // HYBRID RESPONSE
      // =========================
      if (!structuredAnswer && !finalContext) {
        return res.json({
          question,
          workflow,
          answer: "Not found in data.",
          top_chunks: [],
          sources: [],
          coaching_answer: emptyCoachingAnswer(),
          weakness_report: weaknessReport,
          // ✅ ADD HERE
          visualMeta: null,
          visuals: [],
        });
      }

      console.log("🧠 STRUCTURED ANSWER FINAL:", structuredAnswer);
      console.log("📄 FINAL CONTEXT EXISTS:", !!finalContext);

      let hybridContext = buildReasoningContext({
        question,
        structuredAnswer,
        finalChunks,
        weaknessReport,
      });

      // 🔥 ADD THIS
      if (isReasonQuestion) {
        hybridContext += `

      The user is asking for the reason behind a loss or poor performance.

      Use both structured match data and retrieved evidence if available.

      Focus on:
      - identifying the main cause of the loss
      - linking weakness signals to match outcome
      - explaining cause → effect clearly

      Do NOT list random weaknesses.
      Explain WHY the player lost based on the evidence.
      `;
      }  



      const answer = await askAI(question, hybridContext);
      const parsedAnswer = parseCoachingAnswer(answer);
      const visualMeta = generateVisualTags(question, answer);
      const visuals = retrieveVisuals(visualMeta);

      return res.json({
        question,
        workflow,
        matched_file: structuredFile,
        structured_answer: structuredAnswer,
        sources: finalChunks.map((item) => ({
          file: item.metadata?.file_name || "unknown",
          score: item.score,
        })),
        top_chunks: finalChunks.map((item) => ({
          file: item.metadata?.file_name || "unknown",
          score: item.score,
          preview: (item.text || "").slice(0, 150),
        })),
        answer,
        coaching_answer: parsedAnswer,
        weakness_report: weaknessReport,
        visualMeta,
        visuals,
      });
    } catch (err) {
      console.error("CHAT ERROR:", err);
      res.status(500).json({
        error: "Error processing chat request",
        details: err.message,
      });
    }
  });

  export default router;
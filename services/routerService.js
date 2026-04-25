

export function detectWorkflow(query) {
  const q = query.toLowerCase();

  console.log("detectWorkflow running with:", q);

    // 🔥 PRIORITY 1 — Reason / WHY questions
  const reasonKeywords = [
    "why",
    "reason",
    "reasons",
    "lost",
    "lose",
    "loss",
    "defeat",
    "cause",
    "caused",
    "what went wrong",
    "why did",
  ];

  const isReasonQuestion = reasonKeywords.some((word) => q.includes(word));

  if (isReasonQuestion) {
    return "hybrid"; // 🔥 FORCE HYBRID (IMPORTANT)
  }

  // =========================
  // NORMAL LOGIC BELOW
  // =========================

  const researchKeywords = [
    "study",
    "research",
    "journal",
    "article",
    "paper",
    "literature",
    "conclusion",
    "findings",
    "evidence",
  ];

  const structuredKeywords = [
    "match",
    "stat",
    "stats",
    "performance",
    "score",
    "serve",
    "return",
    "aces",
    "double fault",
    "double faults",
    "break point",
    "break points",
    "win rate",
    "percentage",
    "percent",
    "average",
    "avg",
    "total",
    "number",
    "data",
    "spreadsheet",
    "sheet",
    "table",
    "csv",
    "excel",
    "xlsx",
  ];

  const unstructuredKeywords = [
    "report",
    "reports",
    "training",
    "note",
    "notes",
    "coach",
    "coaching",
    "weakness",
    "weaknesses",
    "strength",
    "strengths",
    "recommendation",
    "recommend",
    "improve",
    "improvement",
    "feedback",
    "summary",
    "summarise",
    "summarize",
    "observation",
    "observations",
    "session",
    "journal article",
    "presentation",
    "slide",
    "slides",
  ];

  const comparisonKeywords = [
    "compare",
    "comparison",
    "difference",
    "differences",
    "versus",
    "vs",
  ];

  const hybridKeywords = [
  "combine",
  "both",
  "together",
  "match stats and research",
  "match data and reports",
  "stats and reports",
  "data and research",
];

const hasResearchIntent = researchKeywords.some((word) => q.includes(word));
const hasStructured = structuredKeywords.some((word) => q.includes(word));
const hasUnstructured =
  hasResearchIntent ||
  unstructuredKeywords.some((word) => q.includes(word));
const isComparison = comparisonKeywords.some((word) => q.includes(word));
const isHybridIntent = hybridKeywords.some((word) => q.includes(word));

if (isHybridIntent && (hasStructured || hasUnstructured)) return "hybrid";
if (isComparison && (hasStructured || hasUnstructured)) return "comparison";
if (hasStructured && hasUnstructured) return "hybrid";
if (hasStructured) return "structured";
return "unstructured";
}

export function findBestMatches(files, query) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 1);

  return files
    .map((file) => {
      const key = file.key.toLowerCase();
      let score = 0;

      for (const word of words) {
        if (key.includes(word)) {
          score += 2;
        }
      }

      if (key.includes(query.toLowerCase())) {
        score += 5;
      }

      if (key.includes("player-profiles")) {
        score += 3;
      }

      if (key.includes("reports")) {
        score += 1;
      }

      return { ...file, score };
    })
    .filter((file) => file.score > 0 && !file.key.endsWith("/"))
    .sort((a, b) => b.score - a.score);
}

export function selectBestStructuredFile(files = [], question = "") {
  const q = question.toLowerCase();

  const playerTerms = ["nadal", "federer", "djokovic", "alcaraz", "sinner"];
  const statTerms = [
    "serve",
    "return",
    "aces",
    "double faults",
    "break points",
    "win rate",
    "percentage",
    "match",
    "stats",
    "stat",
  ];

  const scored = files
    .filter((file) => file?.key && !file.key.endsWith("/"))
    .map((file) => {
      const key = file.key.toLowerCase();
      let score = 0;

      for (const player of playerTerms) {
        if (q.includes(player) && key.includes(player)) score += 4;
      }

      for (const term of statTerms) {
        if (q.includes(term) && key.includes(term)) score += 2;
      }

      if (key.includes("match-stats")) score += 1;
      if (key.includes("performance")) score += 1;

      return { ...file, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return scored[0] || null;
}

export function extractQueryWords(query) {
  const stopWords = new Set([
    "the",
    "is",
    "a",
    "an",
    "of",
    "for",
    "to",
    "in",
    "on",
    "and",
    "or",
    "what",
    "who",
    "how",
    "give",
    "show",
    "tell",
    "me",
    "about",
    "based",
    "using",
  ]);

  return query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^\w]/g, ""))
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

export function filterStructuredRows(rows, query) {
  const words = extractQueryWords(query);

  if (!words.length) return rows;

  const playerWords = ["nadal", "federer", "djokovic", "alcaraz", "sinner"];
  const statWords = [
    "serve",
    "return",
    "aces",
    "double",
    "faults",
    "break",
    "points",
    "win",
    "rate",
    "percentage",
    "match",
  ];

  const queryPlayers = words.filter((word) => playerWords.includes(word));
  const queryStats = words.filter((word) => statWords.includes(word));

  const filtered = rows.filter((row) => {
    const rowText = JSON.stringify(row).toLowerCase();

    const playerMatch =
      queryPlayers.length === 0 ||
      queryPlayers.some((word) => rowText.includes(word));

    const statMatch =
      queryStats.length === 0 ||
      queryStats.some((word) => rowText.includes(word));

    const generalMatchCount = words.filter((word) => rowText.includes(word)).length;

    if (queryPlayers.length || queryStats.length) {
      return playerMatch && statMatch;
    }

    return generalMatchCount >= 1;
  });

  return filtered.length ? filtered : rows;
}


function getValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return null;
}

function toNumber(value) {
  if (value === null || value === undefined) return null;

  let str = String(value).trim();
  if (!str) return null;

  str = str.replace("%", "").replace(",", "");

  let n = Number(str);
  if (!Number.isFinite(n)) return null;

  // Convert decimal ratios like 0.65 -> 65
  if (n > 0 && n <= 1) {
    n = n * 100;
  }

  return n;
}

function average(values) {
  const valid = values.filter((v) => v !== null && v !== undefined);
  if (!valid.length) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}



export function buildStructuredAnswer(rows, query) {
  if (!rows || rows.length === 0) {
    return `No structured data found for "${query}".`;
  }

  const q = query.toLowerCase();

  // 👉 BASIC STATS QUESTIONS
  if (
    q.includes("how many") ||
    q.includes("count") ||
    q.includes("score") ||
    q.includes("won") ||
    q.includes("loss") ||
    q.includes("matches")
  ) {
  const wins = rows.filter((r) => {
    const status = String(
      r.win_loss_status ||
      r.result_status ||
      r.match_status ||
      ""
    ).toLowerCase();

    return (
      status === "win" ||
      status === "won" ||
      status === "w" ||
      status.includes("win")
    );
  }).length;

  const losses = rows.filter((r) => {
    const status = String(
      r.win_loss_status ||
      r.result_status ||
      r.match_status ||
      ""
    ).toLowerCase();

    return (
      status === "loss" ||
      status === "lost" ||
      status === "l" ||
      status.includes("loss")
    );
  }).length;

  if (q.includes("lost") || q.includes("loss")) {
    return `Out of ${rows.length} matches, ${losses} were lost.`;
  }

  if (q.includes("won") || q.includes("win")) {
    return `Out of ${rows.length} matches, ${wins} were won.`;
  }

return `This structured file contains ${rows.length} match records.`;
  }

  console.log("ROWS SAMPLE:", rows.slice(0, 2));
  console.log("ROW KEYS:", Object.keys(rows[0] || {}));

  const firstServePct = average(
    rows.map((row) =>
      toNumber(
        getValue(row, [
          "first_serve_pct",
          "First Serve %",
          "FirstServe%",
          "firstServePct",
          "1st Serve %",
          "First Serve Percentage"
        ])
      )
    )
  );

  const secondServeWonPct = average(
  rows.map((row) =>
    toNumber(
      getValue(row, [
        "second_serve_points_won_pct",
        "Second Serve Points Won %",
        "SecondServeWon%",
        "secondServeWonPct",
        "2nd Serve %",
        "Second Serve %",
        "Second Serve Won %",
        "2nd Serve Won %",
        "Second Serve Points Won Percentage"
      ])
    )
  )
);
  const doubleFaults = average(
  rows.map((row) =>
    toNumber(
      getValue(row, [
        "double_faults",
        "Double Faults",
        "DF",
        "doubleFaults"
      ])
    )
  )
);

  const breakPointsSavedPct = average(
  rows.map((row) =>
    toNumber(
      getValue(row, [
        "break_points_saved_pct",
        "Break Points Saved %",
        "BreakPointsSaved%",
        "breakPointsSavedPct",
        "BP Saved %",
        "Break Point Save %",
        "Break Point Saved %"
      ])
    )
  )
);

  const returnPointsWonPct = average(
  rows.map((row) =>
    toNumber(
      getValue(row, [
        "return_points_won_pct",
        "Return Points Won %",
        "ReturnPointsWon%",
        "returnPointsWonPct",
        "Return %",
        "Return Point Won %",
        "Return Won %"
      ])
    )
  )
);

console.log("DEBUG STRUCTURED METRICS:");
console.log({
  firstServePct,
  secondServeWonPct,
  doubleFaults,
  breakPointsSavedPct,
  returnPointsWonPct,
});

const hasPerformanceMetrics =
  firstServePct !== null ||
  secondServeWonPct !== null ||
  doubleFaults !== null ||
  breakPointsSavedPct !== null ||
  returnPointsWonPct !== null;

if (!hasPerformanceMetrics) {
  const availableColumns = Object.keys(rows[0] || {}).join(", ");

  return `The structured file does not contain performance metrics such as first serve percentage, second serve points won, double faults, break points saved, or return points won. Available columns are: ${availableColumns}. Based on this file, I can only analyse match results or scores, not performance weaknesses.`;
}

  const insights = [];
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  // First serve
  if (firstServePct !== null) {
    insights.push(`First serve percentage averages ${firstServePct.toFixed(1)}%.`);

    if (firstServePct < 58) {
      weaknesses.push("first serve consistency is below target");
      recommendations.push("prioritise first-serve reliability under match pressure");
    } else if (firstServePct >= 65) {
      strengths.push("first serve consistency is a positive area");
    }
  }

  // Second serve
  if (secondServeWonPct !== null) {
    insights.push(`Second serve points won averages ${secondServeWonPct.toFixed(1)}%.`);

    if (secondServeWonPct < 48) {
      weaknesses.push("second serve effectiveness is a clear weakness");
      recommendations.push("build second-serve patterns that protect the next ball");
    } else if (secondServeWonPct >= 55) {
      strengths.push("second serve performance is holding up well");
    }
  }

  // Double faults
  if (doubleFaults !== null) {
    insights.push(`Double faults average ${doubleFaults.toFixed(1)} per match.`);

    if (doubleFaults > 4) {
      weaknesses.push("double faults are too high");
      recommendations.push("reduce second-serve risk and improve repeatable serve mechanics");
    } else if (doubleFaults <= 2) {
      strengths.push("double-fault control is solid");
    }
  }

  // Break points saved
  if (breakPointsSavedPct !== null) {
    insights.push(`Break points saved averages ${breakPointsSavedPct.toFixed(1)}%.`);

    if (breakPointsSavedPct < 55) {
      weaknesses.push("pressure performance on serve looks weak");
      recommendations.push("train break-point serve routines and pressure-point decision making");
    } else if (breakPointsSavedPct >= 65) {
      strengths.push("pressure management on serve looks strong");
    }
  }

  // Return points won
  if (returnPointsWonPct !== null) {
    insights.push(`Return points won averages ${returnPointsWonPct.toFixed(1)}%.`);

    if (returnPointsWonPct < 38) {
      weaknesses.push("return performance is below target");
      recommendations.push("improve return depth and first-strike positioning");
    } else if (returnPointsWonPct >= 42) {
      strengths.push("return performance is a useful strength");
    }
  }

  const patternSummary = [];

  if (
    secondServeWonPct !== null &&
    doubleFaults !== null &&
    secondServeWonPct < 48 &&
    doubleFaults > 4
  ) {
    patternSummary.push(
      "The main pattern is second-serve instability, with low second-serve success combined with high double faults."
    );
  }

  if (
    firstServePct !== null &&
    breakPointsSavedPct !== null &&
    firstServePct < 58 &&
    breakPointsSavedPct < 55
  ) {
    patternSummary.push(
      "Serve reliability appears to drop further under pressure, not just in general play."
    );
  }

  if (
    returnPointsWonPct !== null &&
    returnPointsWonPct < 38
  ) {
    patternSummary.push(
      "Return games are not creating enough pressure, which may reduce scoreboard control."
    );
  }

  let answer = "";

  if (patternSummary.length) {
    answer += `Key pattern: ${patternSummary.join(" ")} `;
  }

  if (insights.length) {
    answer += `${insights.join(" ")} `;
  }

  if (strengths.length) {
    answer += `Strengths: ${strengths.join(", ")}. `;
  }

  if (weaknesses.length) {
    answer += `Main concerns: ${weaknesses.join(", ")}. `;
  } else {
    answer += `No major structured weakness stands out from the selected rows. `;
  }

  if (recommendations.length) {
    const uniqueRecommendations = [...new Set(recommendations)];
    answer += `Coaching focus: ${uniqueRecommendations.join("; ")}.`;
  }

  return answer.trim();
}
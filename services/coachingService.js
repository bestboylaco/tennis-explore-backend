// services/coachingService.js

export function buildUnstructuredSignals(chunks) {
  if (!chunks || chunks.length === 0) {
    return {
      found: false,
      signals: [],
      summary: "No coaching reports found."
    };
  }

  const signals = chunks.map((chunk) => ({
    type: "report",
    text: chunk.text,
    score: chunk.score,
    source: chunk.file_name || "unknown"
  }));

  return {
    found: true,
    signals,
    summary: signals.map(s => s.text).join("\n\n")
  };
}

export function buildStructuredSignals(rows) {
  if (!rows || rows.length === 0) {
    return {
      found: false,
      signals: [],
      summary: "No match stats found."
    };
  }

  const signals = [];

  rows.forEach((row) => {
    const firstServe = Number(row.first_serve_pct);
    const doubleFaults = Number(row.double_faults);

    if (firstServe && firstServe < 58) {
      signals.push({
        type: "weakness",
        text: `Low first serve percentage (${firstServe}%)`
      });
    }

    if (doubleFaults && doubleFaults > 4) {
      signals.push({
        type: "weakness",
        text: `High double faults (${doubleFaults})`
      });
    }
  });

  return {
    found: true,
    signals,
    summary: signals.map(s => s.text).join(". ")
  };
}
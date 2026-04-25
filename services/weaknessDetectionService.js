const weaknessPatterns = [
  {
    label: "serve consistency",
    keywords: [
      "low first serve",
      "serve inconsistency",
      "serve drops",
      "double faults",
      "inconsistent serve",
      "missed first serves",
      "low serve percentage"
    ],
    recommendation: "Prioritise serve consistency drills under pressure.",
  },
  {
    label: "second serve effectiveness",
    keywords: [
      "second serve",
      "weak second serve",
      "second-serve points lost",
      "poor second serve",
      "second serve attacked"
    ],
    recommendation: "Train second-serve reliability and first-ball patterns after serve.",
  },
  {
    label: "return performance",
    keywords: [
      "weak return",
      "return points",
      "return effectiveness",
      "poor return",
      "struggled on return",
      "return depth",
      "late return preparation"
    ],
    recommendation: "Work on return positioning, anticipation, and depth control.",
  },
  {
    label: "backhand stability",
    keywords: [
      "backhand inconsistency",
      "backhand errors",
      "backhand instability",
      "targeted backhand",
      "backhand broke down",
      "late on backhand"
    ],
    recommendation: "Increase repetition under pressure with backhand control drills.",
  },
  {
    label: "forehand stability",
    keywords: [
      "forehand inconsistency",
      "forehand errors",
      "forehand instability",
      "forehand broke down",
      "overhit forehand",
      "poor forehand decision"
    ],
    recommendation: "Reinforce forehand mechanics and decision-making under fatigue.",
  },
  {
    label: "movement and footwork",
    keywords: [
      "poor footwork",
      "slow recovery",
      "late movement",
      "movement efficiency",
      "out of position",
      "slow first step",
      "wide ball recovery"
    ],
    recommendation: "Improve split-step timing, recovery steps, and movement efficiency.",
  },
  {
    label: "trunk rotation",
    keywords: [
      "less trunk rotation",
      "reduced trunk rotation",
      "limited trunk rotation",
      "poor trunk rotation"
    ],
    recommendation: "Improve trunk rotation control and movement efficiency in stroke drills.",
  },
  {
    label: "end-range stroke control",
    keywords: [
      "end-range forehands",
      "end-range backhands",
      "end-range shots",
      "wide forehand control",
      "wide backhand control"
    ],
    recommendation: "Practice end-range shot execution in realistic match-like movement patterns.",
  },
  {
    label: "pressure handling",
    keywords: [
      "under pressure",
      "break points saved",
      "pressure situations",
      "break point",
      "tight moments",
      "closing games",
      "decision-making under pressure"
    ],
    recommendation: "Simulate pressure scenarios and rehearse repeatable point routines.",
  },
  {
    label: "fatigue-related decline",
    keywords: [
      "late in matches",
      "under fatigue",
      "decreases late",
      "drops late",
      "fatigue",
      "tired",
      "physical decline"
    ],
    recommendation: "Train skill retention under fatigue with late-session technical drills.",
  },
];

function getEvidenceSnippet(text, keyword, padding = 120) {
  const lower = text.toLowerCase();
  const index = lower.indexOf(keyword.toLowerCase());

  if (index === -1) {
    return text.slice(0, 240);
  }

  const start = Math.max(0, index - padding);
  const end = Math.min(text.length, index + keyword.length + padding);

  return text.slice(start, end).trim();
}

export function detectWeaknessSignals(text = "") {
  const lower = text.toLowerCase();
  const matches = [];

  for (const pattern of weaknessPatterns) {
    const matchedKeywords = pattern.keywords.filter((keyword) =>
      lower.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      matches.push({
        label: pattern.label,
        recommendation: pattern.recommendation,
        matched_keywords: matchedKeywords,
        confidence: matchedKeywords.length >= 2 ? "medium" : "low",
        evidence: getEvidenceSnippet(text, matchedKeywords[0]),
      });
    }
  }

  return matches;
}

export function buildWeaknessReportFromChunks(chunks = []) {
  if (!chunks.length) {
    return {
      summary: "No weakness signals found.",
      items: [],
    };
  }

  const found = [];

  for (const chunk of chunks) {
    const text = chunk.text || "";
    const signals = detectWeaknessSignals(text);

    for (const signal of signals) {
      found.push({
        label: signal.label,
        recommendation: signal.recommendation,
        matched_keywords: signal.matched_keywords,
        confidence: signal.confidence,
        evidence: signal.evidence,
        source: chunk.metadata?.file_name || "unknown",
        score: chunk.score ?? null,
      });
    }
  }

  const grouped = new Map();

  for (const item of found) {
    if (!grouped.has(item.label)) {
      grouped.set(item.label, {
        ...item,
        occurrences: 1,
        sources: [item.source],
      });
    } else {
      const existing = grouped.get(item.label);
      existing.occurrences += 1;

      if (!existing.sources.includes(item.source)) {
        existing.sources.push(item.source);
      }

      if (item.score && (!existing.score || item.score > existing.score)) {
        existing.score = item.score;
        existing.evidence = item.evidence;
      }
    }
  }

  const items = [...grouped.values()].sort((a, b) => {
    if ((b.occurrences || 0) !== (a.occurrences || 0)) {
      return (b.occurrences || 0) - (a.occurrences || 0);
    }

    return (b.score || 0) - (a.score || 0);
  });

  return {
    summary: items.length
      ? items.map((item) => item.label).join(", ")
      : "No weakness signals found.",
    items,
  };
}
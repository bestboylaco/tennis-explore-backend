function removeReferenceSection(text) {
  const patterns = [
    /\nreferences[\s\S]*$/i,
    /\nbibliography[\s\S]*$/i,
    /\nworks cited[\s\S]*$/i,
    /\nliterature cited[\s\S]*$/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return text.replace(pattern, "").trim();
    }
  }

  return text;
}

function removeFrontMatterNoise(text) {
  return text
    // remove DOI lines
    .replace(/doi:\s*\S+/gi, "")
    // remove received/accepted/published dates
    .replace(/received\s+\d{1,2}\s+\w+\s+\d{4}/gi, "")
    .replace(/accepted\s+\d{1,2}\s+\w+\s+\d{4}/gi, "")
    .replace(/published\s+online\s+\d{1,2}\s+\w+\s+\d{4}/gi, "")
    // remove page numbers on isolated lines
    .replace(/^\s*\d+\s*$/gm, "")
    .trim();
}

function removeCitationNoise(text) {
  return text
    // (Smith et al., 2020)
    .replace(/\(\s*[A-Z][A-Za-z-]+(?:\s+et al\.)?,?\s*\d{4}[a-z]?\s*\)/g, "")
    // [1], [2,3]
    .replace(/\[\d+(?:\s*,\s*\d+)*\]/g, "")
    // superscript-like reference remnants
    .replace(/\s\^\d+\s/g, " ");
}

function extractUsefulSections(text) {
  const lower = text.toLowerCase();

  const sectionNames = [
    "abstract",
    "results",
    "discussion",
    "conclusion",
    "conclusions",
    "practical implications",
    "key findings",
  ];

  const found = [];

  for (const name of sectionNames) {
    const index = lower.indexOf(name);
    if (index !== -1) {
      found.push({ name, index });
    }
  }

  if (found.length === 0) {
    return text;
  }

  found.sort((a, b) => a.index - b.index);

  const extracted = [];

  for (let i = 0; i < found.length; i++) {
    const start = found[i].index;
    const end = i + 1 < found.length ? found[i + 1].index : text.length;
    extracted.push(text.slice(start, end).trim());
  }

  return extracted.join("\n\n");
}

function removeMethodHeavySections(text) {
  const lower = text.toLowerCase();
  const methodNames = ["methods", "methodology", "materials and methods", "participants"];

  let earliestMethodIndex = -1;

  for (const name of methodNames) {
    const idx = lower.indexOf(name);
    if (idx !== -1 && (earliestMethodIndex === -1 || idx < earliestMethodIndex)) {
      earliestMethodIndex = idx;
    }
  }

  const resultsIndex = lower.indexOf("results");

  // If methods appears before results, remove that middle block
  if (earliestMethodIndex !== -1 && resultsIndex !== -1 && earliestMethodIndex < resultsIndex) {
    return text.slice(0, earliestMethodIndex) + "\n\n" + text.slice(resultsIndex);
  }

  return text;
}

export function processJournalArticleText(rawText = "") {
  let text = rawText;

  text = removeFrontMatterNoise(text);
  text = removeReferenceSection(text);
  text = removeCitationNoise(text);
  text = removeMethodHeavySections(text);
  text = extractUsefulSections(text);

  return text.trim();
}
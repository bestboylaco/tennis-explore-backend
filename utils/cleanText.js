export function cleanText(text = "") {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")

    // Remove repeated spaces
    .replace(/[ ]{2,}/g, " ")

    // Remove spaces before punctuation
    .replace(/\s+([,.;:!?])/g, "$1")

    // Fix broken hyphenation across line breaks: perfor-\nmance -> performance
    .replace(/([a-zA-Z])-\n([a-zA-Z])/g, "$1$2")

    // Replace single newlines inside paragraphs with spaces
    .replace(/(?<!\n)\n(?!\n)/g, " ")

    // Keep paragraph breaks clean
    .replace(/\n{3,}/g, "\n\n")

    // Remove repeated boilerplate-like separators
    .replace(/[-_=]{3,}/g, " ")

    .trim();
}
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  bull: "•",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

const BLOCK_TAGS = /<\/?(p|div|br|li|ul|ol|h[1-6]|tr|section|article|header|footer|blockquote)\b[^>]*>/gi;

/**
 * Job descriptions arrive as HTML, sometimes entity-escaped twice (Greenhouse). Produce readable
 * plain text that keeps paragraph and bullet structure for the model and the UI.
 */
export function htmlToText(html: string, maxLength = 20_000): string {
  let text = html;
  // Greenhouse double-escapes: decode until no markup entities remain.
  for (let i = 0; i < 2 && /&lt;|&gt;|&amp;/.test(text); i++) text = decodeEntities(text);
  text = text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(BLOCK_TAGS, "\n")
    .replace(/<[^>]+>/g, "");
  text = decodeEntities(text)
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    // Keep consecutive bullets in one list.
    .replace(/(• [^\n]*)\n+(?=• )/g, "$1\n")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

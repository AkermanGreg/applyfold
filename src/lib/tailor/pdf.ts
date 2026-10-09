import { PDFDocument, type PDFFont, StandardFonts, rgb } from "pdf-lib";

export type CoverLetter = { greeting: string; paragraphs: string[]; closing: string };

/** Standard PDF fonts only cover WinAnsi; swap typographic characters they can't encode. */
export function toWinAnsi(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[^\x20-\x7e\xa0-\xff\n]/g, "");
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Render a cover letter as a one-page-ish PDF (many ATSs reject .txt). Generated on demand
 * from the encrypted draft, so edits always show up and no extra copy sits in storage.
 */
export async function renderCoverLetterPdf(input: {
  letter: CoverLetter;
  candidate: { name: string | null; email: string | null; phone: string | null; location: string | null };
  company: string;
  date: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(toWinAnsi(`Cover letter - ${input.company}`));
  pdf.setAuthor(toWinAnsi(input.candidate.name ?? ""));
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 64;
  const size = 11;
  const leading = 15.5;
  let page = pdf.addPage([612, 792]);
  const width = page.getWidth() - margin * 2;
  let y = page.getHeight() - margin;

  const write = (text: string, font = regular, fontSize = size, color = rgb(0.1, 0.1, 0.1)) => {
    for (const line of wrapText(toWinAnsi(text), font, fontSize, width)) {
      if (y < margin) {
        page = pdf.addPage([612, 792]);
        y = page.getHeight() - margin;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font, color });
      y -= leading;
    }
  };

  if (input.candidate.name) write(input.candidate.name, bold, 16);
  const contact = [input.candidate.email, input.candidate.phone, input.candidate.location].filter(Boolean).join("  |  ");
  if (contact) write(contact, regular, 9.5, rgb(0.35, 0.35, 0.35));
  y -= leading;
  write(input.date);
  y -= leading * 0.5;
  write(input.letter.greeting);
  y -= leading * 0.5;
  for (const paragraph of input.letter.paragraphs) {
    write(paragraph);
    y -= leading * 0.5;
  }
  write(input.letter.closing);
  if (input.candidate.name) write(input.candidate.name);

  return pdf.save();
}

import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { renderCoverLetterPdf, toWinAnsi, wrapText } from "./pdf";

describe("cover letter PDF", () => {
  it("replaces characters standard PDF fonts can't encode", () => {
    expect(toWinAnsi("St. Anne’s — “ICU” … 🙂")).toBe(`St. Anne's - "ICU" ... `);
  });

  it("wraps text to the page width", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const lines = wrapText("word ".repeat(60).trim(), font, 11, 200);
    expect(lines.length).toBeGreaterThan(5);
    for (const line of lines) expect(font.widthOfTextAtSize(line, 11)).toBeLessThanOrEqual(200);
  });

  it("renders a valid PDF", async () => {
    const bytes = await renderCoverLetterPdf({
      letter: {
        greeting: "Dear Hiring Team,",
        paragraphs: ["I’ve spent four years in a 24-bed ICU.", "I’d welcome the chance to talk."],
        closing: "Sincerely,",
      },
      candidate: { name: "Maya Patel", email: "maya@example.com", phone: null, location: "Columbus, OH" },
      company: "Riverside Health",
      date: "October 8, 2026",
    });
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBe(1);
    expect(parsed.getTitle()).toBe("Cover letter - Riverside Health");
  });
});

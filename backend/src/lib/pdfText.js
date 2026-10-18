import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extracts text from a PDF buffer, grouped by page and, within each page,
 * clustered into rows by y-position so table-ish layouts survive roughly
 * intact. Runs fully in Node — no worker thread, no system binaries.
 */
export async function extractPdfStructured(buffer) {
  const data = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const items = content.items
      .filter((item) => "str" in item && item.str.trim())
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }));

    // Cluster into rows: items whose y-position is within a small tolerance
    // of each other are treated as being on the same line.
    const rows = [];
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    for (const item of sorted) {
      let row = rows.find((r) => Math.abs(r.y - item.y) < 3);
      if (!row) {
        row = { y: item.y, items: [] };
        rows.push(row);
      }
      row.items.push(item);
    }
    rows.forEach((r) => r.items.sort((a, b) => a.x - b.x));

    pages.push({
      text: rows.map((r) => r.items.map((it) => it.text).join(" ")).join("\n"),
      rows: rows.map((r) => r.items.map((it) => ({ text: it.text, x: it.x }))),
    });
  }

  return pages;
}

export async function extractPdfPlainText(buffer) {
  const pages = await extractPdfStructured(buffer);
  return pages.map((p) => p.text).join("\n\n");
}

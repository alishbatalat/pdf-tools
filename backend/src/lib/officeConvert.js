import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import * as cheerio from "cheerio";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { Document, Packer, Paragraph, PageBreak, TextRun } from "docx";
import { renderNodeToPdf } from "./htmlToPdf.js";
import { extractPdfStructured } from "./pdfText.js";

function createPdfBuffer(buildFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    Promise.resolve(buildFn(doc))
      .then(() => doc.end())
      .catch(reject);
  });
}

function swapExt(filename, ext) {
  return filename.replace(/\.[^.]+$/, "") + "." + ext;
}

// ---- Word -> PDF ----------------------------------------------------------

export async function wordToPdf(buffer) {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const $ = cheerio.load(`<div id="root">${html}</div>`);
  return createPdfBuffer(async (doc) => {
    await renderNodeToPdf(doc, $, $("#root").get(0));
  });
}

// Legacy OLE-based .doc files — no rich formatting, just paragraph text.
export async function wordLegacyToPdf(buffer) {
  const extractor = new WordExtractor();
  const extracted = await extractor.extract(buffer);
  const body = extracted.getBody();
  const paragraphs = body.split(/\r?\n/).filter((line) => line.trim());

  return createPdfBuffer((doc) => {
    if (!paragraphs.length) {
      doc.font("Helvetica").fontSize(12).text("This document has no extractable text.");
      return;
    }
    for (const para of paragraphs) {
      doc.font("Helvetica").fontSize(11).text(para);
      doc.moveDown(0.4);
    }
  });
}

// ---- Excel -> PDF -----------------------------------------------------------

export async function excelToPdf(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  return createPdfBuffer((doc) => {
    wb.worksheets.forEach((sheet, idx) => {
      if (idx > 0) doc.addPage();
      doc.font("Helvetica-Bold").fontSize(14).text(sheet.name);
      doc.moveDown(0.5);

      const rows = [];
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const cells = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          cells.push(cell.value == null ? "" : String(cell.value));
        });
        rows.push(cells);
      });
      if (!rows.length) return;

      const colCount = Math.max(...rows.map((r) => r.length));
      const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidth = Math.max(usableWidth / colCount, 40);
      const fontSize = colCount > 10 ? 6 : colCount > 6 ? 8 : 9;

      for (const row of rows) {
        if (doc.y + fontSize * 2 > doc.page.height - doc.page.margins.bottom) doc.addPage();
        const startX = doc.page.margins.left;
        const startY = doc.y;
        let maxLines = 1;
        row.forEach((cellText, c) => {
          const x = startX + c * colWidth;
          const height = doc.heightOfString(cellText, { width: colWidth - 4 });
          maxLines = Math.max(maxLines, Math.ceil(height / (fontSize * 1.2)));
          doc.font("Helvetica").fontSize(fontSize).text(cellText, x, startY, { width: colWidth - 4 });
        });
        doc.y = startY + Math.max(maxLines * fontSize * 1.3, fontSize * 1.6);
      }
    });
    if (!wb.worksheets.length) doc.font("Helvetica").fontSize(12).text("This spreadsheet has no sheets.");
  });
}

// ---- PowerPoint -> PDF (best-effort: text only, no shapes/images/theme) ----

function decodeXmlEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function pptSlideParagraphs(xml) {
  const paraRegex = /<a:p>([\s\S]*?)<\/a:p>/g;
  const runRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
  const paragraphs = [];
  let pm;
  while ((pm = paraRegex.exec(xml))) {
    let text = "";
    let rm;
    runRegex.lastIndex = 0;
    while ((rm = runRegex.exec(pm[1]))) text += rm[1];
    paragraphs.push(decodeXmlEntities(text));
  }
  return paragraphs;
}

export async function pptToPdf(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)\.xml/)[1]) - Number(b.match(/slide(\d+)\.xml/)[1]));

  return createPdfBuffer(async (doc) => {
    if (!slideFiles.length) {
      doc.font("Helvetica").fontSize(12).text("Couldn't find any slides in this file.");
      return;
    }
    for (let i = 0; i < slideFiles.length; i++) {
      if (i > 0) doc.addPage();
      const xml = await zip.files[slideFiles[i]].async("text");
      const paragraphs = pptSlideParagraphs(xml).filter((p) => p.trim());

      doc.font("Helvetica").fontSize(10).fillColor("gray").text(`Slide ${i + 1}`);
      doc.fillColor("black").moveDown(0.5);

      if (!paragraphs.length) {
        doc.font("Helvetica-Oblique").fontSize(11).fillColor("gray").text("(no extractable text on this slide)");
        doc.fillColor("black");
        continue;
      }
      paragraphs.forEach((para, idx) => {
        doc
          .font(idx === 0 ? "Helvetica-Bold" : "Helvetica")
          .fontSize(idx === 0 ? 20 : 13)
          .text(para);
        doc.moveDown(0.4);
      });
    }
  });
}

// ---- PDF -> Word (best-effort: text only, no images/exact layout) --------

export async function pdfToWord(buffer) {
  const pages = await extractPdfStructured(buffer);
  const children = [];

  pages.forEach((page, idx) => {
    if (idx > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
    const lines = page.text.split("\n").filter((l) => l.trim());
    if (!lines.length) {
      children.push(new Paragraph({ text: "" }));
      return;
    }
    for (const line of lines) {
      children.push(new Paragraph({ children: [new TextRun(line)] }));
    }
  });

  const doc = new Document({
    sections: [{ children: children.length ? children : [new Paragraph("")] }],
  });
  return Packer.toBuffer(doc);
}

// ---- PDF -> Excel (best-effort table reconstruction from text position) --

function clusterRowIntoCells(rowItems, gapThreshold = 18) {
  if (!rowItems.length) return [];
  const sorted = [...rowItems].sort((a, b) => a.x - b.x);
  const cells = [];
  let current = [sorted[0].text];
  let lastX = sorted[0].x;
  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (item.x - lastX > gapThreshold) {
      cells.push(current.join(" "));
      current = [item.text];
    } else {
      current.push(item.text);
    }
    lastX = item.x;
  }
  cells.push(current.join(" "));
  return cells;
}

export async function pdfToExcel(buffer) {
  const pages = await extractPdfStructured(buffer);
  const wb = new ExcelJS.Workbook();

  pages.forEach((page, idx) => {
    const sheet = wb.addWorksheet(`Page ${idx + 1}`);
    for (const row of page.rows) {
      const cells = clusterRowIntoCells(row);
      if (cells.length) sheet.addRow(cells);
    }
  });
  if (!wb.worksheets.length) wb.addWorksheet("Sheet1");
  return wb.xlsx.writeBuffer();
}

// ---- Webpage -> PDF (best-effort "reader view", no CSS/exact layout) -----

export async function webpageToPdf(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; pdf-tools-bot/1.0)" },
  });
  if (!res.ok) throw new Error(`Couldn't fetch that page (${res.status}).`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script,style,noscript,nav,footer").remove();
  const title = $("title").first().text().trim() || url;

  return createPdfBuffer(async (doc) => {
    doc.font("Helvetica-Bold").fontSize(20).text(title);
    doc.moveDown(1);
    const body = $("body").get(0);
    if (body) await renderNodeToPdf(doc, $, body, { baseUrl: url });
  });
}

// ---- Dispatcher used by the generic /api/convert-file route --------------

export async function convertFile(buffer, filename, inputFormat, outputFormat) {
  const key = `${inputFormat.toLowerCase()}->${outputFormat.toLowerCase()}`;
  switch (key) {
    case "docx->pdf":
      return { bytes: await wordToPdf(buffer), filename: swapExt(filename, "pdf") };
    case "doc->pdf":
      return { bytes: await wordLegacyToPdf(buffer), filename: swapExt(filename, "pdf") };
    case "xlsx->pdf":
      return { bytes: await excelToPdf(buffer), filename: swapExt(filename, "pdf") };
    case "pptx->pdf":
      return { bytes: await pptToPdf(buffer), filename: swapExt(filename, "pdf") };
    case "pdf->docx":
      return { bytes: await pdfToWord(buffer), filename: swapExt(filename, "docx") };
    case "pdf->xlsx":
      return { bytes: await pdfToExcel(buffer), filename: swapExt(filename, "xlsx") };
    case "xls->pdf":
      throw new Error("Legacy .xls files aren't supported — please save it as .xlsx and try again.");
    case "ppt->pdf":
      throw new Error("Legacy .ppt files aren't supported — please save it as .pptx and try again.");
    default:
      throw new Error(`Conversion from ${inputFormat} to ${outputFormat} isn't supported.`);
  }
}

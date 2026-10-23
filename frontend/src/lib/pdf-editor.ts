import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getPdfjs } from "./pdf-worker";

export type EditorElementBase = {
  id: string;
  pageIndex: number;
  /** All geometry is a percentage of the page's own width/height, top-left origin. */
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  /** 0 (invisible) to 1 (fully opaque). Defaults to 1 wherever omitted. */
  opacity?: number;
};

export type TextFontFamily = "sans-serif" | "serif" | "monospace";

export type TextEditorElement = EditorElementBase & {
  type: "text";
  text: string;
  fontSize: number; // points
  fontFamily: TextFontFamily;
  color: string; // #rrggbb — fill/text color
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  /** Outline drawn around the text box, in the given color — null means no border. */
  borderColor: string | null;
  /** When set, a filled rectangle is drawn behind the text to mask whatever was there before (used to "edit" existing PDF text, which can't be modified in place). */
  coverColor: string | null;
};

export type ImageEditorElement = EditorElementBase & {
  type: "image";
  dataUrl: string;
  format: "png" | "jpeg";
  /** Signatures (drawn/uploaded/captured via the Sign PDF tool) are tagged so the UI can treat them distinctly from ordinary inserted images. */
  isSignature?: boolean;
};

export type ShapeEditorElement = EditorElementBase & {
  type: "rect" | "line";
  color: string; // #rrggbb
  strokeWidth: number;
  fillColor: string | null; // rect only
};

export type EditorElement = TextEditorElement | ImageEditorElement | ShapeEditorElement;

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

const FONT_FAMILIES: Record<TextFontFamily, { regular: StandardFonts; bold: StandardFonts; italic: StandardFonts; boldItalic: StandardFonts }> = {
  "sans-serif": {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    italic: StandardFonts.HelveticaOblique,
    boldItalic: StandardFonts.HelveticaBoldOblique,
  },
  serif: {
    regular: StandardFonts.TimesRoman,
    bold: StandardFonts.TimesRomanBold,
    italic: StandardFonts.TimesRomanItalic,
    boldItalic: StandardFonts.TimesRomanBoldItalic,
  },
  monospace: {
    regular: StandardFonts.Courier,
    bold: StandardFonts.CourierBold,
    italic: StandardFonts.CourierOblique,
    boldItalic: StandardFonts.CourierBoldOblique,
  },
};

function fontForStyle(family: TextFontFamily, bold: boolean, italic: boolean) {
  const set = FONT_FAMILIES[family] ?? FONT_FAMILIES["sans-serif"];
  if (bold && italic) return set.boldItalic;
  if (bold) return set.bold;
  if (italic) return set.italic;
  return set.regular;
}

/** Loads the original PDF and draws every element directly onto its page, then returns the flattened result. */
export async function applyPdfEdits(file: File, elements: EditorElement[]): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" isn't a valid PDF, or it's password-protected.`);
  }

  const pages = doc.getPages();
  const fontCache = new Map<string, Awaited<ReturnType<typeof doc.embedFont>>>();
  const imageCache = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>();

  for (const el of elements) {
    const page = pages[el.pageIndex];
    if (!page) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const x = (el.xPct / 100) * pageWidth;
    const w = (el.wPct / 100) * pageWidth;
    const h = (el.hPct / 100) * pageHeight;
    const y = pageHeight - (el.yPct / 100) * pageHeight - h; // flip to bottom-left origin

    const opacity = el.opacity ?? 1;

    if (el.type === "text") {
      if (el.coverColor) {
        page.drawRectangle({ x, y, width: w, height: h, color: hexToRgb(el.coverColor) });
      }
      const fontKey = fontForStyle(el.fontFamily, el.bold, el.italic);
      let font = fontCache.get(fontKey);
      if (!font) {
        font = await doc.embedFont(fontKey);
        fontCache.set(fontKey, font);
      }
      const lineHeight = el.fontSize * 1.25;
      let cursorY = y + h - el.fontSize;
      for (const line of el.text.split("\n")) {
        page.drawText(line, { x, y: cursorY, size: el.fontSize, font, color: hexToRgb(el.color), opacity });
        const textWidth = font.widthOfTextAtSize(line, el.fontSize);
        if (el.underline) {
          const underlineY = cursorY - el.fontSize * 0.12;
          page.drawLine({
            start: { x, y: underlineY },
            end: { x: x + textWidth, y: underlineY },
            thickness: Math.max(0.75, el.fontSize * 0.05),
            color: hexToRgb(el.color),
            opacity,
          });
        }
        if (el.strikethrough) {
          const strikeY = cursorY + el.fontSize * 0.32;
          page.drawLine({
            start: { x, y: strikeY },
            end: { x: x + textWidth, y: strikeY },
            thickness: Math.max(0.75, el.fontSize * 0.05),
            color: hexToRgb(el.color),
            opacity,
          });
        }
        cursorY -= lineHeight;
      }
      if (el.borderColor) {
        page.drawRectangle({ x, y, width: w, height: h, borderColor: hexToRgb(el.borderColor), borderWidth: 1, opacity });
      }
    } else if (el.type === "image") {
      let image = imageCache.get(el.dataUrl);
      if (!image) {
        const imgBytes = await (await fetch(el.dataUrl)).arrayBuffer();
        image = el.format === "png" ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
        imageCache.set(el.dataUrl, image);
      }
      page.drawImage(image, { x, y, width: w, height: h, opacity });
    } else if (el.type === "rect") {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: hexToRgb(el.color),
        borderWidth: el.strokeWidth,
        color: el.fillColor ? hexToRgb(el.fillColor) : undefined,
        opacity,
      });
    } else {
      page.drawLine({
        start: { x, y: y + h / 2 },
        end: { x: x + w, y: y + h / 2 },
        thickness: el.strokeWidth,
        color: hexToRgb(el.color),
        opacity,
      });
    }
  }

  const result = await doc.save();
  return new Blob([new Uint8Array(result)], { type: "application/pdf" });
}

export type TextHitItem = {
  str: string;
  fontSize: number; // points, approximate
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
};

/**
 * Reads each page's existing text runs (via pdf.js) so the editor can offer to "edit" them in
 * place. A run's exact bounding box and font are approximations — PDFs don't expose an editable
 * text model, so this is the same cover-and-redraw approach lightweight PDF editors use.
 */
export async function extractTextItems(file: File): Promise<TextHitItem[][]> {
  const pdfjsLib = await getPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const byPage: TextHitItem[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const { width: pageWidthPt, height: pageHeightPt } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: TextHitItem[] = [];

    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str.trim()) continue;
      const [, , , , e, f] = raw.transform as number[];
      const width = raw.width;
      const height = raw.height;
      if (!width || !height || !pageWidthPt || !pageHeightPt) continue;
      items.push({
        str: raw.str,
        fontSize: height,
        xPct: (e / pageWidthPt) * 100,
        yPct: ((pageHeightPt - f - height) / pageHeightPt) * 100,
        wPct: (width / pageWidthPt) * 100,
        hPct: (height / pageHeightPt) * 100,
      });
    }

    byPage.push(items);
  }

  return byPage;
}

/** Finds the smallest existing text run whose box contains (xPct, yPct), if any. */
export function findTextItemAt(items: TextHitItem[], xPct: number, yPct: number): TextHitItem | null {
  let best: TextHitItem | null = null;
  for (const item of items) {
    const within =
      xPct >= item.xPct &&
      xPct <= item.xPct + item.wPct &&
      yPct >= item.yPct &&
      yPct <= item.yPct + item.hPct;
    if (!within) continue;
    if (!best || item.wPct * item.hPct < best.wPct * best.hPct) best = item;
  }
  return best;
}

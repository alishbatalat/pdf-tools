import { createWorker } from "tesseract.js";
import { getPdfjs } from "./pdf-worker";

/**
 * Extracts text from a (likely scanned) PDF by rendering each page to a
 * canvas and running OCR on it, entirely in the browser (tesseract.js,
 * WASM — no server, no API key). Much slower than normal text extraction;
 * only use this when a PDF has no real text layer.
 */
export async function ocrPdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<string> {
  const pdfjsLib = await getPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  const worker = await createWorker("eng");
  const pageTexts: string[] = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;

      const {
        data: { text },
      } = await worker.recognize(canvas);
      pageTexts.push(text.trim());
      onProgress?.(i, pdf.numPages);
    }
  } finally {
    await worker.terminate();
  }

  return pageTexts.join("\n\n").trim();
}

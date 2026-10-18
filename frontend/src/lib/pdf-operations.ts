import { PDFDocument, degrees } from "pdf-lib";
import JSZip from "jszip";
import { getPdfjs } from "./pdf-worker";

export async function loadPdfLibDoc(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer();
  try {
    return await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" isn't a valid PDF, or it's password-protected.`);
  }
}

function toBlob(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

export async function zipFiles(named: Array<{ name: string; data: Blob | Uint8Array }>): Promise<Blob> {
  const zip = new JSZip();
  for (const { name, data } of named) zip.file(name, data);
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}

/** One PDF per page. Caller decides whether to zip (not needed for a single page). */
export async function splitEveryPage(
  file: File,
): Promise<Array<{ name: string; data: Uint8Array }>> {
  const src = await loadPdfLibDoc(file);
  const count = src.getPageCount();
  const files: Array<{ name: string; data: Uint8Array }> = [];

  for (let i = 0; i < count; i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    files.push({ name: `page-${String(i + 1).padStart(2, "0")}.pdf`, data: await doc.save() });
  }

  return files;
}

/** Extract the given 0-based page indices into a single new PDF. */
export async function extractPages(file: File, indices: number[]): Promise<Blob> {
  const src = await loadPdfLibDoc(file);
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, indices);
  pages.forEach((p) => doc.addPage(p));
  return toBlob(await doc.save());
}

/** rotations: pageIndex -> degrees to add (90/180/270), applied on top of existing rotation. */
export async function rotatePages(file: File, rotations: Record<number, number>): Promise<Blob> {
  const doc = await loadPdfLibDoc(file);
  doc.getPages().forEach((page, i) => {
    const add = rotations[i];
    if (add) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + add + 360) % 360));
    }
  });
  return toBlob(await doc.save());
}

export async function deletePages(file: File, indicesToDelete: number[]): Promise<Blob> {
  const doc = await loadPdfLibDoc(file);
  const sorted = [...new Set(indicesToDelete)].sort((a, b) => b - a);
  for (const idx of sorted) doc.removePage(idx);
  return toBlob(await doc.save());
}

/** newOrder is a list of original 0-based indices in their new order. */
export async function reorderPages(file: File, newOrder: number[]): Promise<Blob> {
  const src = await loadPdfLibDoc(file);
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, newOrder);
  pages.forEach((p) => doc.addPage(p));
  return toBlob(await doc.save());
}

/** Shrinks each page's visible area by the given point margins (does not re-flow content). */
export async function cropPages(
  file: File,
  margins: { top: number; bottom: number; left: number; right: number },
): Promise<Blob> {
  const doc = await loadPdfLibDoc(file);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const left = Math.min(margins.left, width / 2 - 1);
    const right = Math.min(margins.right, width / 2 - 1);
    const top = Math.min(margins.top, height / 2 - 1);
    const bottom = Math.min(margins.bottom, height / 2 - 1);
    page.setCropBox(left, bottom, width - left - right, height - top - bottom);
  });
  return toBlob(await doc.save());
}

export async function imagesToPdf(files: File[]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    let image;
    try {
      image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    } catch {
      throw new Error(`"${file.name}" couldn't be read as an image.`);
    }
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return toBlob(await doc.save());
}

export async function pdfPagesToImageBlobs(
  file: File,
  format: "png" | "jpeg",
  pageIndices?: number[],
  scale = 2,
): Promise<Array<{ index: number; blob: Blob }>> {
  const pdfjsLib = await getPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const indices = pageIndices ?? Array.from({ length: pdf.numPages }, (_, i) => i);
  const results: Array<{ index: number; blob: Blob }> = [];

  for (const index of indices) {
    const page = await pdf.getPage(index + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Couldn't export that page as an image."))),
        `image/${format}`,
        0.92,
      );
    });
    results.push({ index, blob });
  }

  return results;
}

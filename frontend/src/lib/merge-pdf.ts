import { PDFDocument } from "pdf-lib";
import { readFileWithProgress } from "@/lib/read-with-progress";

export async function getPdfPageCount(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<number | null> {
  try {
    const bytes = onProgress ? await readFileWithProgress(file, onProgress) : await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch {
    return null;
  }
}

export async function mergePdfFiles(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    let source: PDFDocument;
    try {
      source = await PDFDocument.load(bytes);
    } catch {
      throw new Error(`"${file.name}" isn't a valid PDF, or it's password-protected.`);
    }
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const bytes = await merged.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

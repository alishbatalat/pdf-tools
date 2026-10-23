import { getPdfjs } from "@/lib/pdf-worker";

/** Renders just the first page of a PDF as a small data-URL thumbnail. */
export async function getPdfThumbnail(file: File, scale = 0.6): Promise<string | null> {
  try {
    const pdfjsLib = await getPdfjs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, viewport }).promise;
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

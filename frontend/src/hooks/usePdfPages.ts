"use client";

import { useEffect, useState } from "react";
import { getPdfjs } from "@/lib/pdf-worker";

export interface PdfPageThumb {
  index: number; // 0-based original page index
  thumbnail: string; // data URL
  width: number;
  height: number;
}

export function usePdfPages(file: File | null) {
  const [pages, setPages] = useState<PdfPageThumb[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPages([]);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);
    setPages([]);

    (async () => {
      try {
        const pdfjsLib = await getPdfjs();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const results: PdfPageThumb[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, viewport }).promise;
          results.push({
            index: i - 1,
            thumbnail: canvas.toDataURL("image/png"),
            width: viewport.width,
            height: viewport.height,
          });
        }

        if (!cancelled) {
          setPages(results);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't read that PDF. It may be corrupt or password-protected.",
          );
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  return { pages, status, error };
}

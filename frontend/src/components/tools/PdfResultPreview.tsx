"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPdfjs } from "@/lib/pdf-worker";
export default function PdfResultPreview({url}: {url:string}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [readyPage, setReadyPage] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    (async () => {
      try {
        const pdfjs = await getPdfjs();
        if (cancelled) return;
        const task = pdfjs.getDocument({url});
        destroy = () => { void task.destroy(); };
        const pdf = await task.promise;
        if (cancelled) return;
        const documentPage = await pdf.getPage(page);
        const viewport = documentPage.getViewport({scale:1});
        const scaled = documentPage.getViewport({scale: Math.min(1.5, 850 / viewport.width)});
        const offscreen = document.createElement("canvas");
        offscreen.width = scaled.width; offscreen.height = scaled.height;
        await documentPage.render({canvas:offscreen,viewport:scaled}).promise;
        if (cancelled || !canvas.current) return;
        canvas.current.width = offscreen.width; canvas.current.height = offscreen.height;
        canvas.current.getContext("2d")?.drawImage(offscreen,0,0);
        setCount(pdf.numPages); setReadyPage(page); setError("");
      } catch { if (!cancelled) setError("Preview unavailable. You can still download the file to review it."); }
    })();
    return () => { cancelled = true; destroy?.(); };
  }, [url,page]);
  return <section className="result-preview" aria-label="PDF preview"><div className="preview-toolbar"><strong>Document preview</strong><div><button type="button" aria-label="Previous page" disabled={page <= 1 || readyPage !== page} onClick={() => setPage(p => p-1)}><ChevronLeft size={18} /></button><span aria-live="polite">Page {page}{count ? ` of ${count}` : ""}</span><button type="button" aria-label="Next page" disabled={page >= count || readyPage !== page} onClick={() => setPage(p => p+1)}><ChevronRight size={18} /></button></div></div>{error ? <p role="status" className="preview-message">{error}</p> : <><p role="status" className="preview-message" hidden={readyPage === page}>Preparing preview…</p><div className="preview-canvas"><canvas ref={canvas} aria-label={`Preview of page ${page}`} style={{opacity:readyPage === page ? 1 : .35}} /></div></>}</section>;
}


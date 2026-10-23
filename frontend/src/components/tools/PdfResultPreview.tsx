"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { getPdfjs } from "@/lib/pdf-worker";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export default function PdfResultPreview({url}: {url:string}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [readyPage, setReadyPage] = useState(0);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  useEffect(() => { setZoom(1); }, [url]);
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
        const scaled = documentPage.getViewport({scale: Math.min(1.5, 850 / viewport.width) * zoom});
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
  }, [url,page,zoom]);
  return <section className="result-preview" aria-label="PDF preview"><div className="preview-toolbar"><strong>Document preview</strong><div><button type="button" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => setZoom(z => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}><ZoomOut size={17} /></button><span aria-live="polite">{Math.round(zoom * 100)}%</span><button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => setZoom(z => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}><ZoomIn size={17} /></button><span className="preview-toolbar-divider" aria-hidden="true" /><button type="button" aria-label="Previous page" disabled={page <= 1 || readyPage !== page} onClick={() => setPage(p => p-1)}><ChevronLeft size={18} /></button><span aria-live="polite">Page {page}{count ? ` of ${count}` : ""}</span><button type="button" aria-label="Next page" disabled={page >= count || readyPage !== page} onClick={() => setPage(p => p+1)}><ChevronRight size={18} /></button></div></div>{error ? <p role="status" className="preview-message">{error}</p> : <><p role="status" className="preview-message" hidden={readyPage === page}>Preparing preview…</p><div className="preview-canvas"><canvas ref={canvas} aria-label={`Preview of page ${page}`} style={{opacity:readyPage === page ? 1 : .35}} /></div></>}</section>;
}


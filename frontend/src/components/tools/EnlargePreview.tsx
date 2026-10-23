"use client";
/* eslint-disable @next/next/no-img-element -- Previews use local file URLs and locally rendered PDF pages. */
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ZoomIn, ZoomOut, X, FileText } from "lucide-react";
import { getPdfjs } from "@/lib/pdf-worker";
import "@/app/enlarged-preview.css";

type Props = {
  src: string | null;
  label: string;
  details?: string;
  rotation?: number;
  className?: string;
  disabled?: boolean;
  pdfFile?: File;
  pageIndex?: number;
};

export default function EnlargePreview({ src, label, details, rotation = 0, className = "", disabled = false, pdfFile, pageIndex = 0 }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useId();
  const [isOpen, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [sharp, setSharp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [isOpen]);
  useEffect(() => () => { request.current++; cleanup.current?.(); }, []);

  function finishClose() {
    request.current++;
    cleanup.current?.();
    cleanup.current = null;
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function close() {
    if (dialog.current?.open) dialog.current.close();
    else finishClose();
  }
  async function open() {
    if (disabled) return;
    cleanup.current?.(); cleanup.current = null;
    setZoom(1); setSharp(null); setError(""); setLoading(!!pdfFile); setOpen(true);
    const token = ++request.current;
    if (!pdfFile) return;
    try {
      const pdfjs = await getPdfjs();
      const bytes = await pdfFile.arrayBuffer();
      if (token !== request.current) return;
      const task = pdfjs.getDocument({ data: bytes });
      cleanup.current = () => { void task.destroy(); };
      const doc = await task.promise;
      const page = await doc.getPage(pageIndex + 1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 1500 / base.width) });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      if (token === request.current) { setSharp(canvas.toDataURL("image/png")); setError(""); }
    } catch {
      if (token === request.current && !src) setError("This file could not be previewed. It may be damaged or password-protected. You can close this window and choose another file.");
    } finally {
      if (token === request.current) { setLoading(false); cleanup.current?.(); cleanup.current = null; }
    }
  }

  const image = sharp || src;
  const noPreviewAvailable = !image && !loading && !error;
  return <>
    <button
      ref={trigger}
      type="button"
      draggable={false}
      className={`enlarge-trigger ${className}`}
      aria-label={`Enlarge ${label}`}
      title="Enlarge preview"
      disabled={disabled}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}
      onClick={e => { e.preventDefault(); e.stopPropagation(); void open(); }}
    ><ZoomIn size={17} /></button>
    {isOpen && createPortal(
      <dialog ref={dialog} className="enlarged-preview" aria-labelledby={heading} onClose={finishClose} onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) close(); }} onPointerDown={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
        <div className="enlarged-preview-shell">
          <header><div><h2 id={heading}>{label}</h2>{details && <p>{details}</p>}</div><button type="button" className="preview-close" aria-label="Close enlarged preview" onClick={close}><X size={21} /></button></header>
          <div className="enlarged-preview-controls"><span role="status">{loading ? "Preparing a sharper preview…" : "Preview only · original file unchanged"}</span><div role="group" aria-label="Preview zoom"><button type="button" aria-label="Zoom out" disabled={zoom <= .5} onClick={() => setZoom(z => Math.max(.5, z - .25))}><ZoomOut size={18} /></button><button type="button" aria-label="Reset zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><button type="button" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + .25))}><ZoomIn size={18} /></button></div></div>
          <div className="enlarged-preview-image">{error && <p role="alert" className="enlarged-preview-error">{error}</p>}{!image && loading && <p role="status">Loading document preview…</p>}{image && <img src={image} alt={label} draggable={false} onError={() => setError("The preview image could not be loaded. Close the preview and try selecting the file again.")} style={{ width: `${zoom * 100}%`, maxWidth: "none", transform: rotation ? `rotate(${rotation}deg)` : undefined }} />}{noPreviewAvailable && <div className="enlarged-preview-fallback"><FileText size={64} strokeWidth={1.2} /><p>No visual preview is available for this file type.</p></div>}</div>
        </div>
      </dialog>, document.body)}
  </>;
}

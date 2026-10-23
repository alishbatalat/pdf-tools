"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  ScanLine,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { imagesToPdf } from "@/lib/pdf-operations";
import { describeCameraError, openCameraStream } from "@/lib/camera";
import PageListRow from "./PageListRow";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import ViewToggle, { type ViewMode } from "./ViewToggle";
import "@/app/signature.css";

interface ScannedPage {
  id: string;
  dataUrl: string;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function drawToDataUrl(source: CanvasImageSource, width: number, height: number, enhance: boolean): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  if (enhance) ctx.filter = "grayscale(1) contrast(1.35) brightness(1.1)";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function dataUrlToFile(dataUrl: string, name: string): File {
  const [, base64] = dataUrl.split(",");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: "image/jpeg" });
}

export default function ScanToPdfTool() {
  const [queue, setQueue] = useState<ScannedPage[]>([]);
  const [enhance, setEnhance] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cameraOn, setCameraOn] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const uploadInputId = useId();

  useEffect(() => {
    if (!cameraOn || resultUrl) return;
    let cancelled = false;

    async function run() {
      setCameraError("");
      setCameraReady(false);
      try {
        const stream = await openCameraStream();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      } catch (err) {
        if (cancelled) return;
        setCameraError(`Couldn't access your camera: ${describeCameraError(err)} You can still add pages by uploading photos below.`);
      }
    }

    void run();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOn, resultUrl]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const dataUrl = drawToDataUrl(video, video.videoWidth, video.videoHeight, enhance);
    if (!dataUrl) return;
    setQueue((prev) => [...prev, { id: makeId(), dataUrl }]);
  }

  function onFilesPicked(files: FileList | null) {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const img = new Image();
      img.onload = () => {
        const dataUrl = drawToDataUrl(img, img.naturalWidth, img.naturalHeight, enhance);
        if (dataUrl) setQueue((prev) => [...prev, { id: makeId(), dataUrl }]);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  function removeFile(id: string) {
    setQueue((prev) => prev.filter((p) => p.id !== id));
  }

  function moveFile(index: number, direction: -1 | 1) {
    setQueue((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reorderTo(from: number, to: number) {
    if (from === to) return;
    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function handleSave() {
    if (queue.length === 0) return;
    setWorking(true);
    setError(null);
    try {
      const files = queue.map((p, i) => dataUrlToFile(p.dataUrl, `page-${i + 1}.jpg`));
      const blob = await imagesToPdf(files);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't build a PDF from these pages.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setQueue([]);
    setError(null);
    setCameraOn(true);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={ScanLine}
        title={`Scanned ${queue.length} page${queue.length === 1 ? "" : "s"} into one PDF`}
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="scanned.pdf"
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {cameraOn && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="signature-camera-frame">
            {cameraError ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <AlertCircle size={22} className="text-accent" />
                <p className="text-xs text-muted">{cameraError}</p>
              </div>
            ) : (
              <video ref={videoRef} playsInline muted className="signature-camera-video" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-muted">
              <input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />
              <Sparkles size={13} className="text-primary" />
              Enhance for scanning (black &amp; white, boosted contrast)
            </label>
            <button
              type="button"
              disabled={!cameraReady}
              onClick={capture}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Camera size={16} /> Capture page
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <label htmlFor={uploadInputId} className="drive-button" style={{ cursor: "pointer" }}>
          <Upload size={16} />
          Upload photos instead
          <input
            id={uploadInputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              onFilesPicked(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {queue.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <p className="text-xs text-muted">{queue.length} page{queue.length === 1 ? "" : "s"} &mdash; drag to reorder.</p>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                  onDragLeave={() => setDragOverIndex((cur) => (cur === index ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorderTo(dragIndex, index);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  className={`queue-row relative overflow-hidden rounded-xl border border-border bg-background p-2 ${
                    dragIndex === index ? "is-dragging" : ""
                  } ${dragOverIndex === index && dragIndex !== index ? "is-dragover" : ""}`}
                >
                  <span className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-xs font-semibold text-foreground shadow">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove page"
                    onClick={() => removeFile(item.id)}
                    className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-muted shadow hover:text-accent"
                  >
                    <X size={13} />
                  </button>
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.dataUrl} alt={`Page ${index + 1}`} className="h-full w-full object-contain" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                  onDragLeave={() => setDragOverIndex((cur) => (cur === index ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorderTo(dragIndex, index);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  className={`queue-row drag-handle ${dragIndex === index ? "is-dragging" : ""} ${
                    dragOverIndex === index && dragIndex !== index ? "is-dragover" : ""
                  }`}
                >
                  <PageListRow
                    thumbnail={item.dataUrl}
                    label={`Page ${index + 1}`}
                    trailing={
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Move earlier"
                          disabled={index === 0}
                          onClick={() => moveFile(index, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move later"
                          disabled={index === queue.length - 1}
                          onClick={() => moveFile(index, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove page"
                          onClick={() => removeFile(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex justify-center">
            <label htmlFor={`${uploadInputId}-more`} className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary">
              <FilePlus2 size={14} />
              Add more pages
              <input
                id={`${uploadInputId}-more`}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onFilesPicked(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      )}

      {working ? (
        <ProgressBar label={`Building your PDF from ${queue.length} page${queue.length === 1 ? "" : "s"}…`} />
      ) : (
        <button
          type="button"
          disabled={queue.length === 0}
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ScanLine size={16} />
          {queue.length === 0 ? "Capture or upload a page to start" : `Save ${queue.length} page${queue.length === 1 ? "" : "s"} as PDF`}
        </button>
      )}
    </div>
  );
}

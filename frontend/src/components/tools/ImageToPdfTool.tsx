"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  GripVertical,
  Image as ImageIcon,
  UploadCloud,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { imagesToPdf } from "@/lib/pdf-operations";
import { readFilesWithProgress } from "@/lib/read-with-progress";
import GoogleDriveButton from "./GoogleDriveButton";
import PageListRow from "./PageListRow";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import UploadProgressRing from "./UploadProgressRing";
import EnlargePreview from "./EnlargePreview";
import ViewToggle, { type ViewMode } from "./ViewToggle";

interface QueuedImage {
  id: string;
  file: File;
  previewUrl: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExt(name: string) {
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toUpperCase() : "FILE";
}

export default function ImageToPdfTool() {
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickProgress, setPickProgress] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const inputId = useId();
  const addMoreInputId = useId();
  const resultUrlRef = useRef<string | null>(null);

  async function pickUp(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0 || picking) return;
    setPicking(true);
    setPickProgress(0);
    setError(null);
    try {
      await readFilesWithProgress(files, setPickProgress);
      addFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read the selected files. Please try again.");
    } finally {
      setPicking(false);
    }
  }

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((f) =>
      /^image\/(jpeg|png)$/.test(f.type) || /\.(jpe?g|png)$/i.test(f.name),
    );
    if (incoming.length === 0) return;
    setError(null);
    setQueue((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeFile(id: string) {
    setQueue((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
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

  async function handleConvert() {
    if (queue.length === 0) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await imagesToPdf(queue.map((q) => q.file));
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert those images.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    queue.forEach((q) => URL.revokeObjectURL(q.previewUrl));
    setResultUrl(null);
    setQueue([]);
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={ImageIcon}
        title={`Converted ${queue.length} image${queue.length === 1 ? "" : "s"} to PDF`}
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="images.pdf"
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickUp(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center  ${
          picking
            ? "border-primary"
            : dragOver
              ? "border-primary bg-primary-soft"
              : "border-border bg-surface hover:border-primary/40"
        }`}
      >
        {picking ? (
          <UploadProgressRing percent={pickProgress} label="Reading images…" />
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-soft text-secondary">
              <UploadCloud size={22} />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop JPG or PNG images here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted">
                Add one or more images &mdash; you can reorder them below.
              </p>
            </div>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          multiple
          disabled={picking}
          className="sr-only"
          onChange={(e) => {
            const picked = e.target.files ? Array.from(e.target.files) : [];
            e.target.value = "";
            if (picked.length) pickUp(picked);
          }}
        />
      </label>

      <div className="flex justify-center">
        <GoogleDriveButton mimeTypes={["image/jpeg", "image/png"]} multiple onFiles={addFiles} onError={setError} />
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
            <p className="text-xs text-muted">Drag a tile to reorder &mdash; images turn into pages in this order.</p>
            <div className="flex shrink-0 items-center gap-2">
              <ViewToggle mode={viewMode} onChange={setViewMode} />
              <label htmlFor={addMoreInputId} className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary">
                <FilePlus2 size={14} />
                Add more
                <input
                  id={addMoreInputId}
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          {viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <>
            {queue.map((item, index) => (
              <div
                key={item.id}
                      tabIndex={0}
                      onPointerDown={e => { if (e.pointerType === "touch") e.currentTarget.focus({preventScroll:true}); }}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragLeave={() => setDragOverIndex((cur) => (cur === index ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) reorderTo(dragIndex, index);
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className={`queue-row relative overflow-hidden rounded-xl border border-border bg-surface p-2  ${
                  dragIndex === index ? "is-dragging" : ""
                } ${dragOverIndex === index && dragIndex !== index ? "is-dragover" : ""}`}
              >
                <span className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-xs font-semibold text-foreground shadow">
                  {index + 1}
                </span>
                <EnlargePreview src={item.previewUrl} label={item.file.name} details={`Image ${index+1} · ${getExt(item.file.name)} · ${formatSize(item.file.size)}`} className="image-grid-enlarge" />
                <span className="drag-handle absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow">
                  <GripVertical size={13} />
                </span>
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="thumb-hover-overlay">
                    <span className="thumb-chip">Page {index + 1}</span>
                    <span className="thumb-chip">{getExt(item.file.name)}</span>
                    <span className="thumb-chip">{formatSize(item.file.size)}</span>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-center text-xs text-muted">
                  {item.file.name}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={index === 0}
                    onClick={() => moveFile(index, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-surface-muted disabled:opacity-30"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={index === queue.length - 1}
                    onClick={() => moveFile(index, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-surface-muted disabled:opacity-30"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeFile(item.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-accent-soft hover:text-accent"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </>
          </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(index);
                  }}
                  onDragLeave={() => setDragOverIndex((cur) => (cur === index ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorderTo(dragIndex, index);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`queue-row drag-handle ${dragIndex === index ? "is-dragging" : ""} ${
                    dragOverIndex === index && dragIndex !== index ? "is-dragover" : ""
                  }`}
                >
                  <PageListRow
                    thumbnail={item.previewUrl}
                    fileSize={item.file.size}
                    label={`${index + 1}. ${item.file.name}`}
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
                          aria-label="Remove"
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
        </div>
      )}

      {working ? (
        <ProgressBar label={`Converting ${queue.length} image${queue.length === 1 ? "" : "s"}…`} />
      ) : (
        <button
          type="button"
          disabled={queue.length === 0}
          onClick={handleConvert}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {queue.length === 0
            ? "Add images to convert"
            : `Convert ${queue.length} image${queue.length === 1 ? "" : "s"} to PDF`}
        </button>
      )}
    </div>
  );
}






"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  FileStack,
  FileText,
  GripVertical,
  LayoutGrid,
  List,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { getPdfPageCount, mergePdfFiles } from "@/lib/merge-pdf";
import { getPdfThumbnail } from "@/lib/pdf-thumbnail";
import { readFilesWithProgress } from "@/lib/read-with-progress";
import { takeHandoffFile } from "@/lib/file-handoff";

import GoogleDriveButton from "./GoogleDriveButton";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import EnlargePreview from "./EnlargePreview";
import UploadProgressRing from "./UploadProgressRing";

interface QueuedFile {
  id: string;
  file: File;
  pages: number | null | "loading";
  pagesProgress: number;
  thumbnail: string | null | "loading";
}

type ViewMode = "list" | "grid";

type Status = "idle" | "merging" | "done" | "error";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MergePdfTool() {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickProgress, setPickProgress] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const inputId = useId();
  const addMoreInputId = useId();
  const resultUrlRef = useRef<string | null>(null);
  const checkedHandoffRef = useRef(false);

  useEffect(() => {
    if (checkedHandoffRef.current) return;
    checkedHandoffRef.current = true;
    const handoff = takeHandoffFile();
    if (handoff) addFiles([handoff]);
  }, []);

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
    const incoming = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (incoming.length === 0) return;
    setError(null);
    const queued = incoming.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      file,
      pages: "loading" as const,
      pagesProgress: 0,
      thumbnail: "loading" as const,
    }));
    setQueue((prev) => [...prev, ...queued]);
    queued.forEach((item) => {
      const onProgress = (percent: number) => {
        setQueue((prev) => prev.map((f) => (f.id === item.id ? { ...f, pagesProgress: percent } : f)));
      };
      getPdfPageCount(item.file, onProgress).then((pages) => {
        setQueue((prev) => prev.map((f) => (f.id === item.id ? { ...f, pages } : f)));
      });
      getPdfThumbnail(item.file).then((thumbnail) => {
        setQueue((prev) => prev.map((f) => (f.id === item.id ? { ...f, thumbnail } : f)));
      });
    });
  }

  function removeFile(id: string) {
    setQueue((prev) => prev.filter((f) => f.id !== id));
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

  async function handleMerge() {
    if (queue.length < 2) return;
    setStatus("merging");
    setError(null);
    try {
      const blob = await mergePdfFiles(queue.map((q) => q.file));
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while merging.");
      setStatus("error");
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setQueue([]);
    setStatus("idle");
    setError(null);
  }

  const canMerge = queue.length >= 2 && status !== "merging";

  return (
    <div className="space-y-6">
      {status === "done" && resultUrl ? (
        <ResultPanel icon={FileStack} title={`Merged ${queue.length} files into one PDF`} subtitle="Processed in your browser." downloadHref={resultUrl} downloadName="merged.pdf" onReset={reset} />
      ) : (
        <>
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
              <UploadProgressRing percent={pickProgress} label="Reading files…" />
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <UploadCloud size={22} />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Drop PDFs here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Add two or more files &mdash; you can reorder them below.
                  </p>
                </div>
              </>
            )}
            <input
              id={inputId}
              type="file"
              accept="application/pdf,.pdf"
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
            <GoogleDriveButton mimeTypes={["application/pdf"]} multiple onFiles={addFiles} onError={setError} />
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-foreground"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
              <span>{error}</span>
            </div>
          )}

          {queue.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-3 px-1 pb-2">
                <p className="text-xs text-muted">Drag to reorder &mdash; files merge top to bottom.</p>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="flex items-center rounded-lg border border-border p-0.5">
                    <button
                      type="button"
                      aria-label="List view"
                      aria-pressed={viewMode === "list"}
                      onClick={() => setViewMode("list")}
                      className={`flex h-7 w-7 items-center justify-center rounded-md ${
                        viewMode === "list" ? "bg-primary-soft text-primary" : "text-muted"
                      }`}
                    >
                      <List size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Grid view"
                      aria-pressed={viewMode === "grid"}
                      onClick={() => setViewMode("grid")}
                      className={`flex h-7 w-7 items-center justify-center rounded-md ${
                        viewMode === "grid" ? "bg-primary-soft text-primary" : "text-muted"
                      }`}
                    >
                      <LayoutGrid size={14} />
                    </button>
                  </div>
                  <label htmlFor={addMoreInputId} className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary">
                    <FilePlus2 size={14} />
                    Add more
                    <input
                      id={addMoreInputId}
                      type="file"
                      accept="application/pdf,.pdf"
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
              {viewMode === "list" && (
              <ul className="space-y-2">
                <>
                  {queue.map((item, index) => (
                    <li
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
                      className={`queue-row flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5  ${
                        dragIndex === index ? "is-dragging" : ""
                      } ${dragOverIndex === index && dragIndex !== index ? "is-dragover" : ""}`}
                    >
                      <span className="drag-handle flex h-7 w-5 shrink-0 items-center justify-center">
                        <GripVertical size={15} />
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.file.name}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-muted">
                          <span>
                            {formatSize(item.file.size)}
                            {item.pages !== "loading" && item.pages ? ` · ${item.pages} page${item.pages === 1 ? "" : "s"}` : ""}
                            {item.pages === "loading" ? ` · Counting pages… ${item.pagesProgress}%` : ""}
                          </span>
                          {item.pages === "loading" && <Loader2 size={11} className="animate-spin" />}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveFile(index, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted  hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={index === queue.length - 1}
                          onClick={() => moveFile(index, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted  hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove file"
                          onClick={() => removeFile(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted  hover:bg-accent-soft hover:text-accent"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </>
              </ul>
              )}

              {viewMode === "grid" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                      className={`queue-row drag-handle relative overflow-hidden rounded-xl border border-border bg-background p-2  ${
                        dragIndex === index ? "is-dragging" : ""
                      } ${dragOverIndex === index && dragIndex !== index ? "is-dragover" : ""}`}
                    >
                      <EnlargePreview pdfFile={item.file} src={item.thumbnail === "loading" ? null : item.thumbnail} label={item.file.name} details={`PDF · First page preview · ${formatSize(item.file.size)}`} className="merge-grid-enlarge" />
                      <button
                        type="button"
                        aria-label="Remove file"
                        onClick={() => removeFile(item.id)}
                        className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-accent shadow hover:brightness-90"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
                        {item.thumbnail === "loading" ? (
                          <Loader2 size={20} className="animate-spin text-muted" />
                        ) : item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnail} alt={item.file.name} className="h-full w-full object-contain" />
                        ) : (
                          <FileText size={24} className="text-muted" />
                        )}
                        <span className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-[10px] font-semibold text-foreground shadow">
                          {index + 1}
                        </span>
                        <div className="thumb-hover-overlay">
                          <span className="thumb-chip">File {index + 1} · Preview: page 1</span>
                          <span className="thumb-chip">PDF</span>
                          {item.pages !== "loading" && item.pages ? (
                            <span className="thumb-chip">{item.pages} page{item.pages === 1 ? "" : "s"}</span>
                          ) : null}
                          <span className="thumb-chip">{formatSize(item.file.size)}</span>
                        </div>
                      </div>
                      <p className="mt-1.5 truncate text-center text-xs font-medium text-foreground">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === "merging" ? (
            <ProgressBar label={`Merging ${queue.length} PDFs…`} />
          ) : (
            <button
              type="button"
              disabled={!canMerge}
              onClick={handleMerge}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30  disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileStack size={16} />
              {queue.length < 2
                ? "Add at least 2 PDFs to merge"
                : `Merge ${queue.length} PDFs`}
            </button>
          )}
        </>
      )}
    </div>
  );
}









"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileStack,
  UploadCloud,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { mergePdfFiles } from "@/lib/merge-pdf";

import ResultPanel from "./ResultPanel";

interface QueuedFile {
  id: string;
  file: File;
}

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
  const inputId = useId();
  const resultUrlRef = useRef<string | null>(null);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (incoming.length === 0) return;
    setError(null);
    setQueue((prev) => [
      ...prev,
      ...incoming.map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file })),
    ]);
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
              addFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center  ${
              dragOver
                ? "border-primary bg-primary-soft"
                : "border-border bg-surface hover:border-primary/40"
            }`}
          >
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
            <input
              id={inputId}
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
              <ul className="space-y-2">
                <>
                  {queue.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-muted">
                          {formatSize(item.file.size)}
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
            </div>
          )}

          <button
            type="button"
            disabled={!canMerge}
            onClick={handleMerge}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30  disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "merging" ? (
              <>
                <span
                  className="hidden"
                />
                Merging&hellip;
              </>
            ) : (
              <>
                <FileStack size={16} />
                {queue.length < 2
                  ? "Add at least 2 PDFs to merge"
                  : `Merge ${queue.length} PDFs`}
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}




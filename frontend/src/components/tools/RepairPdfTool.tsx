"use client";

import {
  AlertCircle,
  FilePlus2,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Trash2,
  UploadCloud,
  Wrench,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { repairPdf, zipFiles } from "@/lib/pdf-operations";
import { getPdfThumbnail } from "@/lib/pdf-thumbnail";
import GoogleDriveButton from "./GoogleDriveButton";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import EnlargePreview from "./EnlargePreview";

interface QueuedFile {
  id: string;
  file: File;
  thumbnail: string | null | "loading";
}

type ViewMode = "list" | "grid";
type Status = "idle" | "repairing" | "done" | "error";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RepairPdfTool() {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [failedNames, setFailedNames] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("repaired.pdf");
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const inputId = useId();
  const addMoreInputId = useId();
  const resultUrlRef = useRef<string | null>(null);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (incoming.length === 0) return;
    setError(null);
    const queued = incoming.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      file,
      thumbnail: "loading" as const,
    }));
    setQueue((prev) => [...prev, ...queued]);
    queued.forEach((item) => {
      getPdfThumbnail(item.file)
        .then((thumbnail) => {
          setQueue((prev) => prev.map((f) => (f.id === item.id ? { ...f, thumbnail } : f)));
        })
        .catch(() => {
          setQueue((prev) => prev.map((f) => (f.id === item.id ? { ...f, thumbnail: null } : f)));
        });
    });
  }

  function removeFile(id: string) {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleRepair() {
    if (queue.length === 0) return;
    setStatus("repairing");
    setError(null);
    setFailedNames([]);
    const fixed: Array<{ name: string; data: Uint8Array }> = [];
    const failed: string[] = [];
    for (const item of queue) {
      try {
        const result = await repairPdf(item.file);
        fixed.push({ name: result.name, data: result.data });
      } catch {
        failed.push(item.file.name);
      }
    }
    if (fixed.length === 0) {
      setError("None of these files could be repaired — they're too damaged to recover any content from.");
      setStatus("error");
      return;
    }
    setFailedNames(failed);
    const url = fixed.length === 1
      ? URL.createObjectURL(new Blob([new Uint8Array(fixed[0].data)], { type: "application/pdf" }))
      : URL.createObjectURL(await zipFiles(fixed));
    resultUrlRef.current = url;
    setResultUrl(url);
    setResultName(fixed.length === 1 ? fixed[0].name : "repaired-pdfs.zip");
    setStatus("done");
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setQueue([]);
    setStatus("idle");
    setError(null);
    setFailedNames([]);
  }

  const canRepair = queue.length > 0 && status !== "repairing";

  if (status === "done" && resultUrl) {
    return (
      <div className="space-y-4">
        <ResultPanel
          icon={Wrench}
          title={queue.length === 1 ? "PDF repaired" : `Repaired ${queue.length - failedNames.length} of ${queue.length} PDFs`}
          subtitle="Processed in your browser."
          downloadHref={resultUrl}
          downloadName={resultName}
          onReset={reset}
        />
        {failedNames.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-foreground">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Couldn&apos;t recover: {failedNames.join(", ")}. These files had no valid structure
              left to rebuild from.
            </span>
          </div>
        )}
      </div>
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
          addFiles(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center  ${
          dragOver ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/40"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <UploadCloud size={22} />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Drop a PDF here, or click to browse</p>
          <p className="mt-1 text-xs text-muted">
            You can add several corrupt or broken files at once.
          </p>
        </div>
        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            const picked = e.target.files ? Array.from(e.target.files) : [];
            e.target.value = "";
            if (picked.length) addFiles(picked);
          }}
        />
      </label>

      <div className="flex justify-center">
        <GoogleDriveButton mimeTypes={["application/pdf"]} multiple onFiles={addFiles} onError={setError} />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-foreground">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {queue.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <p className="text-xs text-muted">
              {queue.length} file{queue.length === 1 ? "" : "s"} queued for repair.
            </p>
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
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <FileText size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                    <p className="text-xs text-muted">{formatSize(item.file.size)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={() => removeFile(item.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-accent-soft hover:text-accent"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {queue.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-xl border border-border bg-background p-2">
                  <EnlargePreview
                    pdfFile={item.file}
                    src={item.thumbnail === "loading" ? null : item.thumbnail}
                    label={item.file.name}
                    details={`PDF · First page preview · ${formatSize(item.file.size)}`}
                    className="merge-grid-enlarge"
                  />
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
                  </div>
                  <p className="mt-1.5 truncate text-center text-xs font-medium text-foreground">
                    {item.file.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === "repairing" ? (
        <ProgressBar label={`Repairing ${queue.length} PDF${queue.length === 1 ? "" : "s"}…`} />
      ) : (
        <button
          type="button"
          disabled={!canRepair}
          onClick={handleRepair}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Wrench size={16} />
          {queue.length === 0 ? "Add a PDF to repair" : `Repair ${queue.length} PDF${queue.length === 1 ? "" : "s"}`}
        </button>
      )}
    </div>
  );
}

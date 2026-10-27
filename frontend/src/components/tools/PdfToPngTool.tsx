"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckSquare, Download, Image as ImageIcon, RotateCcw } from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { pdfPagesToImageBlobs } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import PageListRow from "./PageListRow";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import ViewToggle, { type ViewMode } from "./ViewToggle";

const RESOLUTIONS = [
  { label: "Standard", scale: 1.5 },
  { label: "High", scale: 2 },
  { label: "Very high", scale: 4 },
] as const;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PngResultItem {
  url: string;
  name: string;
  size: number;
}

export default function PdfToPngTool() {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState<number>(2);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<{ url: string; name: string } | null>(null);
  const [multiResult, setMultiResult] = useState<PngResultItem[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const objectUrlsRef = useRef<string[]>([]);

  const { pages, status, error: loadError } = usePdfPages(file);

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const effectiveIndices = selected.size > 0 ? [...selected].sort((a, b) => a - b) : undefined;

  async function handleExport() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const rendered = await pdfPagesToImageBlobs(file, "png", effectiveIndices, scale);

      if (rendered.length === 1) {
        const url = URL.createObjectURL(rendered[0].blob);
        objectUrlsRef.current = [url];
        setSingleResult({ url, name: `page-${rendered[0].index + 1}.png` });
      } else {
        const items = rendered.map((r) => ({
          url: URL.createObjectURL(r.blob),
          name: `page-${String(r.index + 1).padStart(2, "0")}.png`,
          size: r.blob.size,
        }));
        objectUrlsRef.current = items.map((i) => i.url);
        setMultiResult(items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't export those pages.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setSingleResult(null);
    setMultiResult(null);
    setFile(null);
    setSelected(new Set());
    setError(null);
  }

  if (singleResult) {
    return (
      <ResultPanel
        icon={ImageIcon}
        title="Exported 1 page"
        subtitle="This happened entirely in your browser."
        downloadHref={singleResult.url}
        downloadName={singleResult.name}
        onReset={reset}
      />
    );
  }

  if (multiResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ImageIcon size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Exported {multiResult.length} pages as PNG
            </p>
            <p className="text-xs text-muted">This happened entirely in your browser &mdash; download each page below.</p>
          </div>
        </div>

        <ul className="space-y-2">
          {multiResult.map((item) => (
            <li
              key={item.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.name}
                className="h-10 w-10 shrink-0 rounded-lg border border-border bg-surface-muted object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted">{formatSize(item.size)}</p>
              </div>
              <a
                href={item.url}
                download={item.name}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Download size={13} />
                Download
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-muted"
        >
          <RotateCcw size={15} />
          Start over
        </button>
      </div>
    );
  }

  if (!file) {
    return <PdfDropzone onFile={setFile} title="Drop a PDF here, or click to browse" />;
  }

  return (
    <div className="space-y-6">
      {status === "loading" && <ProgressBar label="Reading pages…" />}

      {(error || loadError) && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error ?? loadError}</span>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {selected.size > 0
                ? `${selected.size} page${selected.size === 1 ? "" : "s"} selected`
                : "All pages will be exported (click to select specific ones)"}
            </p>
            <div className="flex items-center gap-2">
              <ViewToggle mode={viewMode} onChange={setViewMode} />
              <div className="inline-flex rounded-full border border-border bg-surface p-1 text-xs font-semibold">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setScale(r.scale)}
                    className={`rounded-full px-3 py-1.5  ${
                      scale === r.scale ? "bg-primary text-primary-foreground" : "text-muted"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {pages.map((page) => (
                <PageThumbCard pdfFile={file ?? undefined} pageIndex={page.index} fileSize={file?.size}
                  key={page.index}
                  thumbnail={page.thumbnail}
                  label={`Page ${page.index + 1}`}
                  selected={selected.has(page.index)}
                  onClick={() => toggle(page.index)}
                  overlay={
                    selected.has(page.index) ? (
                      <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground">
                        <CheckSquare size={12} />
                      </span>
                    ) : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <PageListRow
                  key={page.index}
                  thumbnail={page.thumbnail}
                  pdfFile={file ?? undefined}
                  pageIndex={page.index}
                  fileSize={file?.size}
                  label={`Page ${page.index + 1}`}
                  selected={selected.has(page.index)}
                  onClick={() => toggle(page.index)}
                  trailing={
                    selected.has(page.index) ? (
                      <CheckSquare size={16} className="shrink-0 text-primary" />
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={working}
            onClick={handleExport}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {working
              ? "Exporting…"
              : `Export ${selected.size > 0 ? selected.size : pages.length} page${
                  (selected.size > 0 ? selected.size : pages.length) === 1 ? "" : "s"
                } as PNG`}
          </button>
        </>
      )}
    </div>
  );
}

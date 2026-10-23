"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckSquare, Image as ImageIcon } from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { pdfPagesToImageBlobs, zipFiles } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import PageListRow from "./PageListRow";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import ViewToggle, { type ViewMode } from "./ViewToggle";

export default function PdfToImageTool() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; name: string; label: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const resultUrlRef = useRef<string | null>(null);

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
      const rendered = await pdfPagesToImageBlobs(file, format, effectiveIndices);
      const ext = format === "jpeg" ? "jpg" : "png";

      if (rendered.length === 1) {
        const url = URL.createObjectURL(rendered[0].blob);
        resultUrlRef.current = url;
        setResult({ url, name: `page-${rendered[0].index + 1}.${ext}`, label: "Exported 1 page" });
      } else {
        const zip = await zipFiles(
          rendered.map((r) => ({ name: `page-${String(r.index + 1).padStart(2, "0")}.${ext}`, data: r.blob })),
        );
        const url = URL.createObjectURL(zip);
        resultUrlRef.current = url;
        setResult({ url, name: "pages.zip", label: `Exported ${rendered.length} pages` });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't export those pages.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
    setFile(null);
    setSelected(new Set());
    setError(null);
  }

  if (result) {
    return (
      <ResultPanel
        icon={ImageIcon}
        title={result.label}
        subtitle="This happened entirely in your browser."
        downloadHref={result.url}
        downloadName={result.name}
        onReset={reset}
      />
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
                {(["png", "jpeg"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`rounded-full px-3 py-1.5  ${
                      format === f ? "bg-primary text-primary-foreground" : "text-muted"
                    }`}
                  >
                    {f.toUpperCase()}
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
                } as ${format.toUpperCase()}`}
          </button>
        </>
      )}
    </div>
  );
}




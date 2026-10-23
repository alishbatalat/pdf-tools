"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckSquare, Crop, Square } from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { clampMarginPair, cropPages } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import PageListRow from "./PageListRow";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import ViewToggle, { type ViewMode } from "./ViewToggle";

const fields: Array<{ key: "top" | "bottom" | "left" | "right"; label: string }> = [
  { key: "top", label: "Top" },
  { key: "bottom", label: "Bottom" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
];

export default function CropPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [scope, setScope] = useState<"all" | "specific">("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const resultUrlRef = useRef<string | null>(null);

  const { pages, status, error: loadError } = usePdfPages(file);
  const guidePage = (scope === "specific" && selected.size > 0
    ? pages.find((p) => p.index === Math.min(...selected))
    : undefined) ?? pages[0];

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(pages.map((p) => p.index)));
  }

  async function applyCrop() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const indices = scope === "specific" ? [...selected] : undefined;
      const blob = await cropPages(file, margins, indices);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't crop this PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
    setScope("all");
    setSelected(new Set());
    setError(null);
  }

  const hasMargins = Object.values(margins).some((v) => v > 0);
  const canApply = hasMargins && (scope === "all" || selected.size > 0);

  if (resultUrl) {
    return (
      <ResultPanel
        icon={Crop}
        title="PDF cropped"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="cropped.pdf"
        onReset={reset}
      />
    );
  }

  if (!file) {
    return <PdfDropzone onFile={setFile} title="Drop a PDF here, or click to browse" />;
  }

  // crop preview box, in percent of page box — mirrors the actual clamping cropPages() applies
  const previewInsetPct = guidePage
    ? (() => {
        const [left, right] = clampMarginPair(margins.left, margins.right, guidePage.width);
        const [top, bottom] = clampMarginPair(margins.top, margins.bottom, guidePage.height);
        return {
          top: (top / guidePage.height) * 100,
          bottom: (bottom / guidePage.height) * 100,
          left: (left / guidePage.width) * 100,
          right: (right / guidePage.width) * 100,
        };
      })()
    : null;

  return (
    <div className="space-y-6">
      {status === "loading" && <ProgressBar label="Reading pages…" />}

      {(error || loadError) && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error ?? loadError}</span>
        </div>
      )}

      {status === "ready" && guidePage && (
        <>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-sm text-muted">
                Preview (page {guidePage.index + 1} of {pages.length}) &mdash; shown as a guide only
              </p>
              <div className="relative overflow-hidden rounded-xl border border-border bg-surface-muted p-4">
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[220px]">
                  {/* client-generated thumbnail, not a remote image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={guidePage.thumbnail}
                    alt={`Page ${guidePage.index + 1} preview`}
                    className="h-full w-full object-contain"
                  />
                  {previewInsetPct && (
                    <div
                      className="pointer-events-none absolute border-2 border-dashed border-primary bg-primary/10"
                      style={{
                        top: `${previewInsetPct.top}%`,
                        bottom: `${previewInsetPct.bottom}%`,
                        left: `${previewInsetPct.left}%`,
                        right: `${previewInsetPct.right}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 rounded-full border border-border bg-surface-muted p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`flex-1 rounded-full px-3 py-2 ${
                    scope === "all" ? "bg-primary text-primary-foreground" : "text-muted"
                  }`}
                >
                  All pages
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScope("specific");
                    setSelected((prev) => (prev.size > 0 ? prev : new Set(pages.map((p) => p.index))));
                  }}
                  className={`flex-1 rounded-full px-3 py-2 ${
                    scope === "specific" ? "bg-primary text-primary-foreground" : "text-muted"
                  }`}
                >
                  Specific pages
                </button>
              </div>

              <p className="text-sm text-muted">
                {scope === "all"
                  ? `Trim margins off all ${pages.length} pages, in points (72pt = 1in).`
                  : "Trim margins off only the pages you pick below, in points (72pt = 1in)."}{" "}
                After applying, you can preview and page through the full cropped document.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {fields.map((field) => (
                  <label key={field.key} className="text-xs font-medium text-muted">
                    {field.label}
                    <input
                      type="number"
                      min={0}
                      value={margins[field.key]}
                      onChange={(e) =>
                        setMargins((prev) => ({
                          ...prev,
                          [field.key]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                ))}
              </div>

              <button
                type="button"
                disabled={!canApply || working}
                onClick={applyCrop}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {working
                  ? "Cropping…"
                  : scope === "specific" && selected.size > 0
                    ? `Apply crop to ${selected.size} page${selected.size === 1 ? "" : "s"}`
                    : "Apply crop"}
              </button>
              {!hasMargins && (
                <p className="text-xs text-muted">Set at least one margin above to enable cropping.</p>
              )}
              {hasMargins && scope === "specific" && selected.size === 0 && (
                <p className="text-xs text-muted">Select at least one page below to enable cropping.</p>
              )}
            </div>
          </div>

          {scope === "specific" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {selected.size > 0
                    ? `${selected.size} page${selected.size === 1 ? "" : "s"} selected`
                    : "Click pages to select them"}
                </p>
                <div className="flex items-center gap-2">
                  <ViewToggle mode={viewMode} onChange={setViewMode} />
                  <button
                    type="button"
                    onClick={selectAll}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                  >
                    <CheckSquare size={14} />
                    Select all
                  </button>
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
                        ) : (
                          <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded bg-background/70 text-muted opacity-0 group-hover:opacity-100">
                            <Square size={12} />
                          </span>
                        )
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
                        ) : (
                          <Square size={16} className="shrink-0 text-muted" />
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}



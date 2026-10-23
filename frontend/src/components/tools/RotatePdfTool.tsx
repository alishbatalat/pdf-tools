"use client";

import { useRef, useState } from "react";
import { AlertCircle, RotateCw, RotateCwSquare } from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { useAppendPdfPages } from "@/hooks/useAppendPdfPages";
import { rotatePages } from "@/lib/pdf-operations";
import AddPagesButton from "./AddPagesButton";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import PageListRow from "./PageListRow";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import ViewToggle, { type ViewMode } from "./ViewToggle";

export default function RotatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const resultUrlRef = useRef<string | null>(null);

  const { pages, status, error: loadError } = usePdfPages(file);
  const { addPages, adding } = useAppendPdfPages(file, setFile, setError);

  function rotateOne(index: number) {
    setRotations((prev) => ({ ...prev, [index]: ((prev[index] ?? 0) + 90) % 360 }));
  }

  function rotateAll() {
    setRotations((prev) => {
      const next = { ...prev };
      pages.forEach((p) => {
        next[p.index] = ((next[p.index] ?? 0) + 90) % 360;
      });
      return next;
    });
  }

  async function applyRotation() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await rotatePages(file, rotations);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't rotate this PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setRotations({});
    setError(null);
  }

  const hasRotations = Object.values(rotations).some((v) => v !== 0);

  if (resultUrl) {
    return (
      <ResultPanel
        icon={RotateCw}
        title="Pages rotated"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="rotated.pdf"
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Click a page to rotate it 90&deg;, or rotate everything at once.
            </p>
            <div className="flex items-center gap-2">
              <ViewToggle mode={viewMode} onChange={setViewMode} />
              <AddPagesButton onPick={addPages} disabled={adding} />
              <button
                type="button"
                onClick={rotateAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground"
              >
                <RotateCwSquare size={14} />
                Rotate all
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
                  rotateDeg={rotations[page.index] ?? 0}
                  selected={!!rotations[page.index]}
                  onClick={() => rotateOne(page.index)}
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
                  rotateDeg={rotations[page.index] ?? 0}
                  selected={!!rotations[page.index]}
                  onClick={() => rotateOne(page.index)}
                  trailing={
                    rotations[page.index] ? (
                      <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                        {rotations[page.index]}&deg;
                      </span>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}

          {working ? (
            <ProgressBar label="Rotating your PDF…" />
          ) : (
            <button
              type="button"
              disabled={!hasRotations}
              onClick={applyRotation}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply rotation
            </button>
          )}
        </>
      )}
    </div>
  );
}




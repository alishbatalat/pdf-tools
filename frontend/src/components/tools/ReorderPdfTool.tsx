"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { usePdfPages, type PdfPageThumb } from "@/hooks/usePdfPages";
import { useAppendPdfPages } from "@/hooks/useAppendPdfPages";
import { reorderPages } from "@/lib/pdf-operations";
import AddPagesButton from "./AddPagesButton";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import PageListRow from "./PageListRow";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import ViewToggle, { type ViewMode } from "./ViewToggle";

export default function ReorderPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [order, setOrder] = useState<PdfPageThumb[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [pagesWereAdded, setPagesWereAdded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const resultUrlRef = useRef<string | null>(null);

  const { pages, status, error: loadError } = usePdfPages(file);
  const { addPages, adding } = useAppendPdfPages(file, setFile, setError);

  function handleAddPages(incoming: File) {
    setPagesWereAdded(true);
    addPages(incoming);
  }

  useEffect(() => {
    if (status !== "ready") return;
    setOrder((prev) => {
      const known = new Set(prev.map((p) => p.index));
      const additions = pages.filter((p) => !known.has(p.index));
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, [status, pages]);

  function move(index: number, direction: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reorderTo(from: number, to: number) {
    if (from === to) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const isDirty = pagesWereAdded || order.some((p, i) => p.index !== i);

  async function applyReorder() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await reorderPages(file, order.map((p) => p.index));
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reorder this PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setOrder([]);
    setPagesWereAdded(false);
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={ListOrdered}
        title="Pages reordered"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="reordered.pdf"
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Drag a page to move it, or use the arrows &mdash; both change the order.
            </p>
            <div className="flex items-center gap-2">
              <ViewToggle mode={viewMode} onChange={setViewMode} />
              <AddPagesButton onPick={handleAddPages} disabled={adding} />
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {order.map((page, i) => (
                <div
                  key={page.index}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(i);
                  }}
                  onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorderTo(dragIndex, i);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`queue-row drag-handle relative  ${dragIndex === i ? "is-dragging" : ""} ${
                    dragOverIndex === i && dragIndex !== i ? "is-dragover" : ""
                  }`}
                >
                  <PageThumbCard pdfFile={file ?? undefined} pageIndex={page.index} fileSize={file?.size} thumbnail={page.thumbnail} label={`${i + 1}`} />
                  <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-between px-1">
                    <button
                      type="button"
                      aria-label="Move earlier"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow disabled:opacity-30"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Move later"
                      disabled={i === order.length - 1}
                      onClick={() => move(i, 1)}
                      className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow disabled:opacity-30"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {order.map((page, i) => (
                <div
                  key={page.index}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(i);
                  }}
                  onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorderTo(dragIndex, i);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`queue-row drag-handle ${dragIndex === i ? "is-dragging" : ""} ${
                    dragOverIndex === i && dragIndex !== i ? "is-dragover" : ""
                  }`}
                >
                  <PageListRow
                    thumbnail={page.thumbnail}
                    pdfFile={file ?? undefined}
                    pageIndex={page.index}
                    fileSize={file?.size}
                    label={`Page ${i + 1}`}
                    trailing={
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Move earlier"
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move later"
                          disabled={i === order.length - 1}
                          onClick={() => move(i, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {working ? (
            <ProgressBar label="Saving the new order…" />
          ) : (
            <button
              type="button"
              disabled={!isDirty}
              onClick={applyReorder}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save new order
            </button>
          )}
        </>
      )}
    </div>
  );
}




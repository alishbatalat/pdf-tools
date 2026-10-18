"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { usePdfPages, type PdfPageThumb } from "@/hooks/usePdfPages";
import { reorderPages } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import ResultPanel from "./ResultPanel";

export default function ReorderPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [order, setOrder] = useState<PdfPageThumb[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const { pages, status, error: loadError } = usePdfPages(file);

  useEffect(() => {
    if (status === "ready") setOrder(pages);
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

  const isDirty = order.some((p, i) => p.index !== i);

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
      {status === "loading" && <p className="text-sm text-muted">Reading pages&hellip;</p>}

      {(error || loadError) && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error ?? loadError}</span>
        </div>
      )}

      {status === "ready" && (
        <>
          <p className="text-sm text-muted">
            Use the arrows to move pages into the order you want.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {order.map((page, i) => (
              <div key={page.index} className="relative">
                <PageThumbCard thumbnail={page.thumbnail} label={`${i + 1}`} />
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

          <button
            type="button"
            disabled={!isDirty || working}
            onClick={applyReorder}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {working ? "Saving…" : "Save new order"}
          </button>
        </>
      )}
    </div>
  );
}


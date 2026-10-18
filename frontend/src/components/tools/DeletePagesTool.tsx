"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileMinus, Trash2 } from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { deletePages } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import ResultPanel from "./ResultPanel";

export default function DeletePagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
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

  async function applyDelete() {
    if (!file) return;
    if (selected.size === pages.length) {
      setError("You can't delete every page — at least one has to remain.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const blob = await deletePages(file, [...selected]);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove those pages.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setSelected(new Set());
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={FileMinus}
        title={`Removed ${selected.size} page${selected.size === 1 ? "" : "s"}`}
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="edited.pdf"
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
            Click the pages you want to remove.
            {selected.size > 0 && ` ${selected.size} selected.`}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {pages.map((page) => (
              <PageThumbCard
                key={page.index}
                thumbnail={page.thumbnail}
                label={`Page ${page.index + 1}`}
                dimmed={selected.has(page.index)}
                selected={selected.has(page.index)}
                onClick={() => toggle(page.index)}
                overlay={
                  selected.has(page.index) ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow">
                      <Trash2 size={15} />
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>

          <button
            type="button"
            disabled={selected.size === 0 || working}
            onClick={applyDelete}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {working
              ? "Removing…"
              : selected.size === 0
                ? "Select pages to remove"
                : `Remove ${selected.size} page${selected.size === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}


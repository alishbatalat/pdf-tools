"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckSquare, Scissors, Square } from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { extractPages, splitEveryPage, zipFiles } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import ResultPanel from "./ResultPanel";

export default function SplitPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [working, setWorking] = useState<"all" | "selected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; name: string; label: string } | null>(null);
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

  function selectAll() {
    setSelected(new Set(pages.map((p) => p.index)));
  }

  async function handleSplitEvery() {
    if (!file) return;
    setWorking("all");
    setError(null);
    try {
      const files = await splitEveryPage(file);
      if (files.length === 1) {
        const blob = new Blob([new Uint8Array(files[0].data)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        setResult({ url, name: files[0].name, label: "Split into 1 file" });
      } else {
        const zip = await zipFiles(files);
        const url = URL.createObjectURL(zip);
        resultUrlRef.current = url;
        setResult({ url, name: "pages.zip", label: `Split into ${files.length} files` });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't split this PDF.");
    } finally {
      setWorking(null);
    }
  }

  async function handleExtractSelected() {
    if (!file || selected.size === 0) return;
    setWorking("selected");
    setError(null);
    try {
      const ordered = [...selected].sort((a, b) => a - b);
      const blob = await extractPages(file, ordered);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({
        url,
        name: "extracted.pdf",
        label: `Extracted ${selected.size} page${selected.size === 1 ? "" : "s"}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't extract those pages.");
    } finally {
      setWorking(null);
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
        icon={Scissors}
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
      {status === "loading" && <p className="text-sm text-muted">Reading pages&hellip;</p>}

      {(error || loadError) && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error ?? loadError}</span>
        </div>
      )}

      {status === "ready" && (
        <>
          <button
            type="button"
            disabled={working !== null}
            onClick={handleSplitEvery}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Scissors size={16} />
            {working === "all"
              ? "Splitting…"
              : pages.length === 1
                ? "Split into 1 file"
                : `Split into ${pages.length} separate files`}
          </button>


          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or pick specific pages</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {selected.size > 0
                ? `${selected.size} page${selected.size === 1 ? "" : "s"} selected`
                : "Click pages to select them"}
            </p>
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
            >
              <CheckSquare size={14} />
              Select all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {pages.map((page) => (
              <PageThumbCard
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
                    <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded bg-background/70 text-muted opacity-0  group-hover:opacity-100">
                      <Square size={12} />
                    </span>
                  )
                }
              />
            ))}
          </div>

          <button
            type="button"
            disabled={selected.size === 0 || working !== null}
            onClick={handleExtractSelected}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {working === "selected"
              ? "Extracting…"
              : `Extract selected pages into one PDF`}
          </button>
        </>
      )}
    </div>
  );
}



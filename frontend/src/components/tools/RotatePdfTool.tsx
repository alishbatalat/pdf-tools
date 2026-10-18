"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RotateCw, RotateCwSquare } from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { rotatePages } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import PageThumbCard from "./PageThumbCard";
import ResultPanel from "./ResultPanel";

export default function RotatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const { pages, status, error: loadError } = usePdfPages(file);

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
      {status === "loading" && (
        <p className="text-sm text-muted">Reading pages&hellip;</p>
      )}

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
            <button
              type="button"
              onClick={rotateAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground"
            >
              <RotateCwSquare size={14} />
              Rotate all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {pages.map((page) => (
              <PageThumbCard
                key={page.index}
                thumbnail={page.thumbnail}
                label={`Page ${page.index + 1}`}
                rotateDeg={rotations[page.index] ?? 0}
                selected={!!rotations[page.index]}
                onClick={() => rotateOne(page.index)}
              />
            ))}
          </div>

          <motion.button
            type="button"
            disabled={!hasRotations || working}
            onClick={applyRotation}
            whileHover={hasRotations ? { scale: 1.02 } : {}}
            whileTap={hasRotations ? { scale: 0.98 } : {}}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {working ? "Rotating…" : "Apply rotation"}
          </motion.button>
        </>
      )}
    </div>
  );
}

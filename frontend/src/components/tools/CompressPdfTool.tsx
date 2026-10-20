"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Minimize2 } from "lucide-react";
import { compressPdf } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import ResultPanel from "./ResultPanel";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; kept: boolean } | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  async function handleCompress() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      // Always starts at "balanced" and, if that doesn't shrink the file,
      // automatically retries at "high" (the most aggressive setting) before
      // giving up — no preset choice exposed, the tool just does its best.
      let blob = await compressPdf(file, "balanced");
      if (blob.size >= file.size) {
        blob = await compressPdf(file, "high");
      }

      // Rasterizing a page can still land bigger than the original for
      // small, text-only PDFs (clean vector text is already compact). Don't
      // hand back a "compressed" file that's actually worse — keep the
      // original in that case.
      const kept = blob.size >= file.size;
      const url = URL.createObjectURL(kept ? file : blob);
      resultUrlRef.current = url;
      setResult({ url, size: kept ? file.size : blob.size, kept });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't compress this PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
    setFile(null);
    setError(null);
  }

  if (result && file) {
    const reduction = Math.round((1 - result.size / file.size) * 100);
    return (
      <ResultPanel
        icon={Minimize2}
        title={result.kept ? "Already as small as it gets" : "PDF compressed"}
        subtitle={
          result.kept
            ? `This document is mostly text, which is already compact — turning its pages into images would make it bigger, not smaller, at every setting. Your original file is unchanged.`
            : `${formatSize(file.size)} → ${formatSize(result.size)} (${reduction}% smaller). Pages are now images — text is no longer selectable.`
        }
        downloadHref={result.url}
        downloadName={result.kept ? file.name : "compressed.pdf"}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <PdfDropzone
        onFile={setFile}
        title="Drop a PDF here, or click to browse"
        hint="PDF files up to 25MB"
        maxSizeMB={25}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm font-medium text-foreground">
          {file.name} <span className="text-muted">({formatSize(file.size)})</span>
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-xs text-muted">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-accent" />
          <span>
            This re-renders each page as an image to shrink file size. The result will no longer
            have selectable/searchable text — best for documents you just need smaller, not ones
            you'll edit or search later.
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      <motion.button
        type="button"
        disabled={working}
        onClick={handleCompress}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minimize2 size={16} />
        {working ? "Compressing…" : "Compress PDF"}
      </motion.button>
    </div>
  );
}

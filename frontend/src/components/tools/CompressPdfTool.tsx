"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Minimize2, Settings2 } from "lucide-react";
import { COMPRESS_SETTINGS, compressPdf } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const DEFAULT_DPI = Math.round(COMPRESS_SETTINGS.balanced.scale * 72);
const DEFAULT_QUALITY = Math.round(COMPRESS_SETTINGS.balanced.quality * 100);

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; kept: boolean } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dpi, setDpi] = useState(DEFAULT_DPI);
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const resultUrlRef = useRef<string | null>(null);

  async function handleCompress() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      let blob: Blob;
      if (showAdvanced) {
        // The user picked exact values — use them as-is, no automatic retry.
        blob = await compressPdf(file, { scale: dpi / 72, quality: quality / 100 });
      } else {
        // Always starts at "balanced" and, if that doesn't shrink the file,
        // automatically retries at "high" (the most aggressive setting) before
        // giving up — no preset choice exposed, the tool just does its best.
        blob = await compressPdf(file, "balanced");
        if (blob.size >= file.size) {
          blob = await compressPdf(file, "high");
        }
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
    setShowAdvanced(false);
    setDpi(DEFAULT_DPI);
    setQuality(DEFAULT_QUALITY);
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

      <div className="rounded-2xl border border-border bg-surface p-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-foreground"
        >
          <span className="flex items-center gap-2">
            <Settings2 size={15} className="text-muted" />
            Advanced settings
          </span>
          <span className="text-xs text-muted">{showAdvanced ? "Use my values" : "Automatic"}</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-muted">DPI</span>
              <input
                type="number"
                min={36}
                max={300}
                step={1}
                value={dpi}
                onChange={(e) => setDpi(Math.min(300, Math.max(36, Number(e.target.value) || DEFAULT_DPI)))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted">Image quality</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(e) => setQuality(Math.min(100, Math.max(1, Number(e.target.value) || DEFAULT_QUALITY)))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <span className="text-sm text-muted">%</span>
              </div>
            </label>
            <p className="sm:col-span-2 text-xs text-muted">
              Higher DPI and quality keep pages sharper but shrink the file less. Lower values compress
              more aggressively.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {working ? (
        <ProgressBar label="Compressing your PDF…" />
      ) : (
        <motion.button
          type="button"
          onClick={handleCompress}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minimize2 size={16} />
          Compress PDF
        </motion.button>
      )}
    </div>
  );
}

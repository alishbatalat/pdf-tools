"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Minimize2 } from "lucide-react";
import { compressPdf, type CompressPreset } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import ResultPanel from "./ResultPanel";

const PRESETS: { value: CompressPreset; label: string; hint: string }[] = [
  { value: "high", label: "High compression", hint: "Smallest file, lower image quality" },
  { value: "balanced", label: "Balanced", hint: "Good trade-off for most documents" },
  { value: "low", label: "Light compression", hint: "Best quality, smaller size reduction" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<CompressPreset>("balanced");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  async function handleCompress() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await compressPdf(file, preset);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ url, size: blob.size });
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
        title="PDF compressed"
        subtitle={
          reduction > 0
            ? `${formatSize(file.size)} → ${formatSize(result.size)} (${reduction}% smaller). Pages are now images — text is no longer selectable.`
            : `${formatSize(file.size)} → ${formatSize(result.size)}. This file didn't shrink further at this setting — try "High compression."`
        }
        downloadHref={result.url}
        downloadName="compressed.pdf"
        onReset={reset}
      />
    );
  }

  if (!file) {
    return <PdfDropzone onFile={setFile} title="Drop a PDF here, or click to browse" />;
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

        <div className="mt-4 space-y-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPreset(p.value)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                preset === p.value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-background text-foreground"
              }`}
            >
              <span className="font-medium">{p.label}</span>
              <span className="text-xs text-muted">{p.hint}</span>
            </button>
          ))}
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

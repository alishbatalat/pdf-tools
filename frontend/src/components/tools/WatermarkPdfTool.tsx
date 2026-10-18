"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Stamp } from "lucide-react";
import { addWatermark } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import ResultPanel from "./ResultPanel";

export default function WatermarkPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.25);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  async function applyWatermark() {
    if (!file || !text.trim()) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await addWatermark(file, text.trim(), { opacity });
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't watermark this PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={Stamp}
        title="Watermark added"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="watermarked.pdf"
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
        <p className="text-sm font-medium text-foreground">{file.name}</p>

        <label className="mt-4 block text-xs font-medium text-muted" htmlFor="watermark-text">
          Watermark text
        </label>
        <input
          id="watermark-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. CONFIDENTIAL"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
        />

        <label className="mt-4 block text-xs font-medium text-muted" htmlFor="watermark-opacity">
          Opacity ({Math.round(opacity * 100)}%)
        </label>
        <input
          id="watermark-opacity"
          type="range"
          min={0.05}
          max={0.6}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      <motion.button
        type="button"
        disabled={!text.trim() || working}
        onClick={applyWatermark}
        whileHover={text.trim() ? { scale: 1.02 } : {}}
        whileTap={text.trim() ? { scale: 0.98 } : {}}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Stamp size={16} />
        {working ? "Adding watermark…" : "Add watermark"}
      </motion.button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Copy, Download, RotateCcw, ScanText } from "lucide-react";
import { ocrPdf } from "@/lib/ocr";
import PdfDropzone from "./PdfDropzone";

export default function OcrPdfTool() {
  const [text, setText] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState<{ page: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(selected: File) {
    setError(null);
    setWorking(true);
    setProgress(null);
    try {
      const extracted = await ocrPdf(selected, (page, total) => setProgress({ page, total }));
      setText(extracted || "(OCR didn't find any text on this document.)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't run OCR on this PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    setText(null);
    setError(null);
    setCopied(false);
    setProgress(null);
  }

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadText() {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ocr-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (text === null && !working) {
    return (
      <div className="space-y-6">
        <PdfDropzone onFile={handleFile} title="Drop a scanned PDF here, or click to browse" />
        <div className="flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-muted">
          <ScanText size={14} className="mt-0.5 shrink-0" />
          <span>
            For PDFs that already have a text layer, use PDF to Text instead — it's much faster.
            Use this one for scanned documents/photos where there's no text to select.
          </span>
        </div>
      </div>
    );
  }

  if (working) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-14 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted">
          {progress ? `Reading page ${progress.page} of ${progress.total}…` : "Starting OCR…"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {text !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <textarea
            readOnly
            value={text}
            rows={14}
            className="w-full resize-y rounded-2xl border border-border bg-surface p-4 font-mono text-xs text-foreground"
          />
          <div className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={downloadText}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
            >
              <Download size={15} />
              Download .txt
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={copyText}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              {copied ? <Check size={15} className="text-secondary" /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy to clipboard"}
            </motion.button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-muted"
            >
              <RotateCcw size={14} />
              Start over
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

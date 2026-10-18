"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, Download, FileType, RotateCcw } from "lucide-react";
import { extractPdfText } from "@/lib/pdf-text";
import PdfDropzone from "./PdfDropzone";

export default function PdfToTextTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(selected: File) {
    setFile(selected);
    setError(null);
    setWorking(true);
    try {
      const extracted = await extractPdfText(selected);
      setText(extracted || "(No extractable text found — this PDF may be a scanned image.)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't extract text from this PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    setFile(null);
    setText(null);
    setError(null);
    setCopied(false);
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
    a.download = "extracted.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!file) {
    return <PdfDropzone onFile={handleFile} title="Drop a PDF here, or click to browse" />;
  }

  return (
    <div className="space-y-6">
      {working && <p className="text-sm text-muted">Extracting text&hellip;</p>}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {text !== null && (
        <div className="space-y-4">
          <textarea
            readOnly
            value={text}
            rows={14}
            className="w-full resize-y rounded-2xl border border-border bg-surface p-4 font-mono text-xs text-foreground"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadText}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
            >
              <Download size={15} />
              Download .txt
            </button>
            <button
              type="button"
              onClick={copyText}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              {copied ? <Check size={15} className="text-secondary" /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy to clipboard"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-muted"
            >
              <RotateCcw size={14} />
              Start over
            </button>
          </div>
        </div>
      )}

      {working && !text && (
        <div className="flex items-center gap-2 text-muted">
          <FileType size={16} />
        </div>
      )}
    </div>
  );
}



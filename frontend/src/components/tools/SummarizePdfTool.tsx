"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, Download, RotateCcw, Sparkles } from "lucide-react";
import { extractPdfText } from "@/lib/pdf-text";
import { summarizeText } from "@/lib/ai-client";
import PdfDropzone from "./PdfDropzone";

export default function SummarizePdfTool() {
  const [phase, setPhase] = useState<"idle" | "reading" | "summarizing" | "done">("idle");
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setSummary(null);
    setPhase("reading");
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        throw new Error("No extractable text found — this PDF may be a scanned image.");
      }
      setPhase("summarizing");
      const { summary: result } = await summarizeText(text);
      setSummary(result);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't summarize this PDF.");
      setPhase("idle");
    }
  }

  function reset() {
    setSummary(null);
    setError(null);
    setPhase("idle");
    setCopied(false);
  }

  async function copySummary() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadSummary() {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (phase === "idle" && !summary) {
    return (
      <div className="space-y-6">
        <PdfDropzone onFile={handleFile} title="Drop a PDF here, or click to browse" />
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  if (phase === "reading" || phase === "summarizing") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-14 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted">
          {phase === "reading" ? "Reading document…" : "Summarizing…"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Sparkles size={16} />
        Summary
      </div>
      <div className="whitespace-pre-wrap rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-foreground">
        {summary}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadSummary}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
        >
          <Download size={15} />
          Download .txt
        </button>
        <button
          type="button"
          onClick={copySummary}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground"
        >
          {copied ? <Check size={15} className="text-secondary" /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
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
  );
}



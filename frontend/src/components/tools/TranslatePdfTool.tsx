"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Copy, Download, Languages, RotateCcw } from "lucide-react";
import { extractPdfText } from "@/lib/pdf-text";
import { translateText } from "@/lib/ai-client";
import PdfDropzone from "./PdfDropzone";

const LANGUAGES = [
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Japanese",
  "Korean",
  "Chinese (Simplified)",
  "Arabic",
  "Hindi",
  "Urdu",
  "Russian",
];

export default function TranslatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [phase, setPhase] = useState<"idle" | "reading" | "translating" | "done">("idle");
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(selected: File) {
    setFile(selected);
    setError(null);
    setPhase("reading");
    try {
      const text = await extractPdfText(selected);
      if (!text.trim()) {
        throw new Error("No extractable text found — this PDF may be a scanned image.");
      }
      setDocumentText(text);
      setPhase("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read this PDF.");
      setPhase("idle");
      setFile(null);
    }
  }

  async function handleTranslate() {
    if (!documentText) return;
    setPhase("translating");
    setError(null);
    try {
      const { translation: result } = await translateText(documentText, language);
      setTranslation(result);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't translate this document.");
      setPhase("idle");
    }
  }

  function reset() {
    setFile(null);
    setDocumentText(null);
    setTranslation(null);
    setError(null);
    setPhase("idle");
    setCopied(false);
  }

  async function copyTranslation() {
    if (!translation) return;
    await navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadTranslation() {
    if (!translation) return;
    const blob = new Blob([translation], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translation-${language.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!file) {
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

  if (phase === "reading" || phase === "translating") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-14 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted">
          {phase === "reading" ? "Reading document…" : `Translating to ${language}…`}
        </p>
      </div>
    );
  }

  if (phase === "done" && translation) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Languages size={16} />
          Translated to {language}
        </div>
        <div className="whitespace-pre-wrap rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-foreground">
          {translation}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadTranslation}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
          >
            <Download size={15} />
            Download .txt
          </button>
          <button
            type="button"
            onClick={copyTranslation}
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
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm font-medium text-foreground">{file.name}</p>
        <label className="mt-4 block text-xs font-medium text-muted" htmlFor="target-language">
          Translate to
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <select
            id="target-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <motion.button
            type="button"
            onClick={handleTranslate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
          >
            Translate
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Tags } from "lucide-react";
import { readPdfMetadata, writePdfMetadata, type PdfMetadata } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";

const EMPTY_META: PdfMetadata = { title: "", author: "", subject: "", keywords: "" };

const FIELDS: Array<{ key: keyof PdfMetadata; label: string; placeholder: string }> = [
  { key: "title", label: "Title", placeholder: "Document title" },
  { key: "author", label: "Author", placeholder: "Author name" },
  { key: "subject", label: "Subject metadata", placeholder: "What this document is about" },
  { key: "keywords", label: "Keywords", placeholder: "Comma-separated, e.g. invoice, 2026, client" },
];

export default function ChangeMetadataTool() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<PdfMetadata>(EMPTY_META);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) {
      setMeta(EMPTY_META);
      return;
    }
    let cancelled = false;
    setLoadingMeta(true);
    readPdfMetadata(file)
      .then((m) => {
        if (!cancelled) setMeta(m);
      })
      .catch(() => {
        if (!cancelled) setMeta(EMPTY_META);
      })
      .finally(() => {
        if (!cancelled) setLoadingMeta(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  async function handleApply() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await writePdfMetadata(file, meta);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update this PDF's information.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setMeta(EMPTY_META);
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={Tags}
        title="Document information updated"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName={file ? file.name : "updated.pdf"}
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
        <p className="mt-1 text-xs text-muted">
          These are the current values stored in the file — edit any of them and save to write a
          new PDF with the updated information.
        </p>
      </div>

      {loadingMeta ? (
        <ProgressBar label="Reading current document information…" />
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {FIELDS.map((field) => (
            <label key={field.key} className="block px-5 py-4 text-xs font-medium text-muted">
              {field.label}
              <input
                type="text"
                value={meta[field.key]}
                placeholder={field.placeholder}
                onChange={(e) => setMeta((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              />
            </label>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {working ? (
        <ProgressBar label="Saving updated information…" />
      ) : (
        <button
          type="button"
          disabled={loadingMeta}
          onClick={handleApply}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Tags size={16} />
          Change data
        </button>
      )}
    </div>
  );
}

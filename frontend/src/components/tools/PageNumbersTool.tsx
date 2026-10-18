"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Hash } from "lucide-react";
import { addPageNumbers } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import ResultPanel from "./ResultPanel";

export default function PageNumbersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  async function handleFile(selected: File) {
    setFile(selected);
    setWorking(true);
    setError(null);
    try {
      const blob = await addPageNumbers(selected);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add page numbers to this PDF.");
      setFile(null);
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
        icon={Hash}
        title="Page numbers added"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="numbered.pdf"
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {working ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-14 text-center"
        >
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted">Adding page numbers&hellip;</p>
        </motion.div>
      ) : (
        <PdfDropzone onFile={handleFile} title="Drop a PDF here, or click to browse" />
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

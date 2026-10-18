"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileOutput } from "lucide-react";
import { convertFileRemote } from "@/lib/convert-client";
import PdfDropzone from "./PdfDropzone";
import ResultPanel from "./ResultPanel";

export default function PdfToOfficeTool({
  outputFormat,
  resultLabel,
}: {
  outputFormat: "docx" | "xlsx";
  resultLabel: string;
}) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState(`converted.${outputFormat}`);
  const resultUrlRef = useRef<string | null>(null);

  async function handleFile(file: File) {
    setWorking(true);
    setError(null);
    try {
      const blob = await convertFileRemote(file, outputFormat);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
      setResultName(file.name.replace(/\.pdf$/i, "") + `.${outputFormat}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert that PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={FileOutput}
        title={resultLabel}
        subtitle="Converted via CloudConvert."
        downloadHref={resultUrl}
        downloadName={resultName}
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {working ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-14 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted">Converting&hellip; this can take up to a minute.</p>
        </div>
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

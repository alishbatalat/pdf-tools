"use client";

import { useRef, useState } from "react";
import { AlertCircle, Ruler } from "lucide-react";
import {
  PAGE_SIZE_PRESETS,
  changePageSizes,
  type PageScalingMode,
  type PageSizePreset,
} from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";

const SIZE_OPTIONS = Object.keys(PAGE_SIZE_PRESETS) as PageSizePreset[];

const SCALING_LABELS: Record<PageScalingMode, string> = {
  fit: "Auto — fit page, keep proportions",
  stretch: "Stretch to fill the new size",
  actual: "Actual size, centered (may crop)",
};

export default function ChangePageSizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState<PageSizePreset>("A4");
  const [mode, setMode] = useState<PageScalingMode>("fit");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  async function handleApply() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const preset = PAGE_SIZE_PRESETS[size];
      const blob = await changePageSizes(file, preset.width, preset.height, mode);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change this PDF's page sizes.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setSize("A4");
    setMode("fit");
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={Ruler}
        title="Page sizes changed"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="resized.pdf"
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
          Every page is resized to the chosen size. A landscape page stays landscape, and a
          portrait page stays portrait — the preset is only used for its dimensions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted">
          New page size
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as PageSizePreset)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          >
            {SIZE_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {PAGE_SIZE_PRESETS[key].label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-muted">
          Page scaling
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as PageScalingMode)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          >
            {(Object.keys(SCALING_LABELS) as PageScalingMode[]).map((key) => (
              <option key={key} value={key}>
                {SCALING_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {working ? (
        <ProgressBar label="Changing page sizes…" />
      ) : (
        <button
          type="button"
          onClick={handleApply}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Ruler size={16} />
          Change page sizes
        </button>
      )}
    </div>
  );
}

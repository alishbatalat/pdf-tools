"use client";

import { useRef, useState } from "react";
import { AlertCircle, Crop } from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { cropPages } from "@/lib/pdf-operations";
import PdfDropzone from "./PdfDropzone";
import ResultPanel from "./ResultPanel";

const fields: Array<{ key: "top" | "bottom" | "left" | "right"; label: string }> = [
  { key: "top", label: "Top" },
  { key: "bottom", label: "Bottom" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
];

export default function CropPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const { pages, status, error: loadError } = usePdfPages(file);
  const preview = pages[0];

  async function applyCrop() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await cropPages(file, margins);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't crop this PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
    setError(null);
  }

  const hasMargins = Object.values(margins).some((v) => v > 0);

  if (resultUrl) {
    return (
      <ResultPanel
        icon={Crop}
        title="PDF cropped"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="cropped.pdf"
        onReset={reset}
      />
    );
  }

  if (!file) {
    return <PdfDropzone onFile={setFile} title="Drop a PDF here, or click to browse" />;
  }

  // crop preview box, in percent of page box, roughly matching point-based margins
  const previewInsetPct = preview
    ? {
        top: Math.min(45, (margins.top / preview.height) * 100 * 2.5),
        bottom: Math.min(45, (margins.bottom / preview.height) * 100 * 2.5),
        left: Math.min(45, (margins.left / preview.width) * 100 * 2.5),
        right: Math.min(45, (margins.right / preview.width) * 100 * 2.5),
      }
    : null;

  return (
    <div className="space-y-6">
      {status === "loading" && <p className="text-sm text-muted">Reading pages&hellip;</p>}

      {(error || loadError) && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error ?? loadError}</span>
        </div>
      )}

      {status === "ready" && preview && (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-sm text-muted">Preview (page 1)</p>
            <div className="relative overflow-hidden rounded-xl border border-border bg-surface-muted p-4">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[220px]">
                {/* client-generated thumbnail, not a remote image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.thumbnail}
                  alt="Page 1 preview"
                  className="h-full w-full object-contain"
                />
                {previewInsetPct && (
                  <div
                    className="pointer-events-none absolute border-2 border-dashed border-primary bg-primary/10"
                    style={{
                      top: `${previewInsetPct.top}%`,
                      bottom: `${previewInsetPct.bottom}%`,
                      left: `${previewInsetPct.left}%`,
                      right: `${previewInsetPct.right}%`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted">
              Trim margins off every page, in points (72pt = 1in).
            </p>
            <div className="grid grid-cols-2 gap-3">
              {fields.map((field) => (
                <label key={field.key} className="text-xs font-medium text-muted">
                  {field.label}
                  <input
                    type="number"
                    min={0}
                    value={margins[field.key]}
                    onChange={(e) =>
                      setMargins((prev) => ({
                        ...prev,
                        [field.key]: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              disabled={!hasMargins || working}
              onClick={applyCrop}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {working ? "Cropping…" : "Apply crop"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


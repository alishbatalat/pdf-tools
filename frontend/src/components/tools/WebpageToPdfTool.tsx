"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Globe } from "lucide-react";
import { convertWebpageRemote } from "@/lib/convert-client";
import ResultPanel from "./ResultPanel";

export default function WebpageToPdfTool() {
  const [url, setUrl] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  async function handleConvert() {
    if (!url.trim()) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await convertWebpageRemote(url.trim());
      const objUrl = URL.createObjectURL(blob);
      resultUrlRef.current = objUrl;
      setResultUrl(objUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert that page.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setUrl("");
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={Globe}
        title="Webpage saved as PDF"
        subtitle="Converted locally by the self-hosted backend."
        downloadHref={resultUrl}
        downloadName="webpage.pdf"
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <label className="text-xs font-medium text-muted" htmlFor="webpage-url">
          Page URL
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="webpage-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
          />
          <motion.button
            type="button"
            disabled={!url.trim() || working}
            onClick={handleConvert}
            whileHover={url.trim() ? { scale: 1.02 } : {}}
            whileTap={url.trim() ? { scale: 0.98 } : {}}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {working ? "Converting…" : "Save as PDF"}
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

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  UploadCloud,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { imagesToPdf } from "@/lib/pdf-operations";
import ResultPanel from "./ResultPanel";

interface QueuedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImageToPdfTool() {
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputId = useId();
  const resultUrlRef = useRef<string | null>(null);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((f) =>
      /^image\/(jpeg|png)$/.test(f.type) || /\.(jpe?g|png)$/i.test(f.name),
    );
    if (incoming.length === 0) return;
    setError(null);
    setQueue((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeFile(id: string) {
    setQueue((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function moveFile(index: number, direction: -1 | 1) {
    setQueue((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleConvert() {
    if (queue.length === 0) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await imagesToPdf(queue.map((q) => q.file));
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't convert those images.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    queue.forEach((q) => URL.revokeObjectURL(q.previewUrl));
    setResultUrl(null);
    setQueue([]);
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={ImageIcon}
        title={`Converted ${queue.length} image${queue.length === 1 ? "" : "s"} to PDF`}
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="images.pdf"
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragOver ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/40"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-soft text-secondary">
          <UploadCloud size={22} />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Drop JPG or PNG images here, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted">
            Add one or more images &mdash; you can reorder them below.
          </p>
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {queue.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence initial={false}>
            {queue.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative overflow-hidden rounded-xl border border-border bg-surface p-2"
              >
                <span className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-xs font-semibold text-foreground shadow">
                  {index + 1}
                </span>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-1.5 truncate text-center text-xs text-muted">
                  {item.file.name}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={index === 0}
                    onClick={() => moveFile(index, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-surface-muted disabled:opacity-30"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={index === queue.length - 1}
                    onClick={() => moveFile(index, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-surface-muted disabled:opacity-30"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeFile(item.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-accent-soft hover:text-accent"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <motion.button
        type="button"
        disabled={queue.length === 0 || working}
        onClick={handleConvert}
        whileHover={queue.length > 0 ? { scale: 1.02 } : {}}
        whileTap={queue.length > 0 ? { scale: 0.98 } : {}}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {working
          ? "Converting…"
          : queue.length === 0
            ? "Add images to convert"
            : `Convert ${queue.length} image${queue.length === 1 ? "" : "s"} to PDF`}
      </motion.button>
    </div>
  );
}

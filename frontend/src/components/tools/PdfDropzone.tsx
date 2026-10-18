"use client";

import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { useId, useState } from "react";

export default function PdfDropzone({
  onFile,
  title = "Drop a PDF here, or click to browse",
  hint = "Only PDF files are accepted.",
  accept = "application/pdf,.pdf",
}: {
  onFile: (file: File) => void;
  title?: string;
  hint?: string;
  accept?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputId = useId();

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFile(list[0]);
  }

  return (
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
        handleFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
        dragOver
          ? "border-primary bg-primary-soft"
          : "border-border bg-surface hover:border-primary/40"
      }`}
    >
      <motion.span
        animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary"
      >
        <UploadCloud size={22} />
      </motion.span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

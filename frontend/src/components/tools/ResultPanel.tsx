"use client";

import { motion } from "framer-motion";
import { Download, RotateCcw, type LucideIcon } from "lucide-react";

export default function ResultPanel({
  icon: Icon,
  title,
  subtitle,
  downloadHref,
  downloadName,
  onReset,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  downloadHref: string;
  downloadName: string;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-10 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
        <Icon size={26} />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          href={downloadHref}
          download={downloadName}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
        >
          <Download size={16} />
          Download {downloadName}
        </motion.a>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground"
        >
          <RotateCcw size={15} />
          Start over
        </button>
      </div>
    </motion.div>
  );
}

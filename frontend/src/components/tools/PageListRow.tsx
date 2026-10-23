"use client";

import type { ReactNode } from "react";
import { displayFileSize } from "@/lib/file-details";
import EnlargePreview from "./EnlargePreview";

export default function PageListRow({
  thumbnail,
  pdfFile,
  pageIndex,
  label,
  fileSize,
  selected = false,
  dimmed = false,
  rotateDeg = 0,
  onClick,
  trailing,
}: {
  thumbnail: string;
  pdfFile?: File;
  pageIndex?: number;
  label: string;
  fileSize?: number;
  selected?: boolean;
  dimmed?: boolean;
  rotateDeg?: number;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
        selected ? "border-primary bg-primary-soft" : "border-border bg-background"
      }`}
    >
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-muted">
          {/* thumbnails are client-generated data URLs, not remote images */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={label}
            className={`max-h-full max-w-full object-contain ${dimmed ? "opacity-30 grayscale" : ""}`}
            style={{ transform: `rotate(${rotateDeg}deg)` }}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{label}</span>
          {fileSize !== undefined && (
            <span className="block text-xs text-muted">{displayFileSize(fileSize)}</span>
          )}
        </span>
      </button>
      <EnlargePreview
        pdfFile={pdfFile}
        pageIndex={pageIndex}
        src={thumbnail}
        label={label}
        rotation={rotateDeg}
        details={fileSize !== undefined ? displayFileSize(fileSize) : undefined}
        className="page-list-enlarge"
      />
      {trailing}
    </div>
  );
}

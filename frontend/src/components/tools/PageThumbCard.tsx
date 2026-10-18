"use client";

import type { ReactNode } from "react";

export default function PageThumbCard({
  thumbnail,
  label,
  selected = false,
  dimmed = false,
  rotateDeg = 0,
  onClick,
  overlay,
}: {
  thumbnail: string;
  label: string;
  selected?: boolean;
  dimmed?: boolean;
  rotateDeg?: number;
  onClick?: () => void;
  overlay?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border-2 bg-surface p-2 text-left  ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
        {/* thumbnails are client-generated data URLs, not remote images */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={label}
          className={`max-h-full max-w-full object-contain   ${dimmed ? "opacity-30 grayscale" : ""}`}
          style={{ transform: `rotate(${rotateDeg}deg)` }}
        />
      </div>
      <p className="mt-1.5 text-center text-xs font-medium text-muted">{label}</p>
      {overlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {overlay}
        </div>
      )}
    </button>
  );
}


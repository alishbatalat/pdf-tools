"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "list" | "grid";

export default function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div role="group" aria-label="File display" className="view-toggle flex items-center rounded-lg border border-border p-0.5">
      <button
        type="button"
        title="List view"
        aria-label="List view"
        aria-pressed={mode === "list"}
        onClick={() => onChange("list")}
        className={`flex h-7 w-7 items-center justify-center rounded-md ${
          mode === "list" ? "bg-primary-soft text-primary" : "text-muted"
        }`}
      >
        <List size={14} />
      </button>
      <button
        type="button"
        title="Grid view"
        aria-label="Grid view"
        aria-pressed={mode === "grid"}
        onClick={() => onChange("grid")}
        className={`flex h-7 w-7 items-center justify-center rounded-md ${
          mode === "grid" ? "bg-primary-soft text-primary" : "text-muted"
        }`}
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  );
}


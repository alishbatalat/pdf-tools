"use client";

import { useId } from "react";
import { FilePlus2 } from "lucide-react";

export default function AddPagesButton({
  onPick,
  disabled,
}: {
  onPick: (file: File) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  return (
    <label htmlFor={inputId} className={`add-pages-button ${disabled ? "is-disabled" : ""}`}>
      <FilePlus2 size={14} />
      {disabled ? "Adding pages…" : "Add pages from another PDF"}
      <input
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

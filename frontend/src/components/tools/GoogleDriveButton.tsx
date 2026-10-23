"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { isGoogleDriveConfigured, pickFromGoogleDrive } from "@/lib/google-drive";

function DriveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 87.3 78" aria-hidden="true">
      <path fill="#0066da" d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" />
      <path fill="#00ac47" d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" />
      <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 11.4z" />
      <path fill="#00832d" d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" />
      <path fill="#2684fc" d="M59.75 53H27.55L13.8 76.8c1.35.8 2.9 1.2 4.5 1.2h48.95c1.6 0 3.15-.45 4.5-1.2z" />
      <path fill="#ffba00" d="M73.4 26.5L60.65 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.1 28h27.45c0-1.55-.4-3.1-1.2-4.5z" />
    </svg>
  );
}

export default function GoogleDriveButton({
  mimeTypes,
  multiple = false,
  disabled = false,
  onFiles,
  onError,
}: {
  mimeTypes: string[];
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!isGoogleDriveConfigured()) return null;

  async function handleClick() {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const files = await pickFromGoogleDrive({ mimeTypes, multiple });
      if (files.length > 0) onFiles(files);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Couldn't import from Google Drive.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="drive-button" disabled={disabled || loading} onClick={handleClick}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : <DriveIcon />}
      {loading ? "Opening Drive…" : "Import from Google Drive"}
    </button>
  );
}

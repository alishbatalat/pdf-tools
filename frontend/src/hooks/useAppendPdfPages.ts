"use client";

import { useCallback, useState } from "react";
import { mergePdfFiles } from "@/lib/merge-pdf";

export function useAppendPdfPages(
  file: File | null,
  setFile: (f: File) => void,
  setError: (msg: string | null) => void,
) {
  const [adding, setAdding] = useState(false);

  const addPages = useCallback(
    async (incoming: File) => {
      if (!file) return;
      setAdding(true);
      setError(null);
      try {
        const blob = await mergePdfFiles([file, incoming]);
        setFile(new File([blob], file.name, { type: "application/pdf" }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't add pages from that file.");
      } finally {
        setAdding(false);
      }
    },
    [file, setFile, setError],
  );

  return { addPages, adding };
}

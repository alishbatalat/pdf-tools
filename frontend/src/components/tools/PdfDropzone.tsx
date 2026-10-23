"use client";
import SelectedFileView from "./SelectedFileView";
import { UploadCloud, ArrowRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";
import UploadProgressRing from "./UploadProgressRing";
import GoogleDriveButton from "./GoogleDriveButton";
import { acceptToDriveMimeTypes } from "@/lib/google-drive";
import { readFilesWithProgress } from "@/lib/read-with-progress";
import { takeHandoffFile } from "@/lib/file-handoff";
export default function PdfDropzone({ onFile, title = "Choose a PDF or drop it here", hint = "PDF files", accept = "application/pdf,.pdf", maxSizeMB }: { onFile: (file: File) => void; title?: string; hint?: string; accept?: string; maxSizeMB?: number }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickProgress, setPickProgress] = useState(0);
  const inputId = useId();
  const checkedHandoffRef = useRef(false);
  useEffect(() => {
    if (checkedHandoffRef.current) return;
    checkedHandoffRef.current = true;
    const handoff = takeHandoffFile();
    if (handoff) pickUp([handoff]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function pickUp(list: FileList | File[] | null) {
    if (!list?.length || picking || busy) return;
    const candidate = list[0];
    const valid = accept.split(",").some(value => { const rule = value.trim().toLowerCase(); return rule.startsWith(".") ? candidate.name.toLowerCase().endsWith(rule) : rule.endsWith("/*") ? candidate.type.startsWith(rule.slice(0,-1)) : candidate.type === rule; });
    if (list.length > 1) { setError("Choose one file at a time."); return; }
    if (!valid) { setError(`Unsupported file format. ${hint}`); return; }
    if (!candidate.size) { setError("This file is empty. Choose another file."); return; }
    if (maxSizeMB && candidate.size > maxSizeMB * 1024 * 1024) {
      const actual = (candidate.size / (1024 * 1024)).toFixed(1);
      setError(`This file is ${actual}MB — the limit here is ${maxSizeMB}MB.`);
      return;
    }
    setError("");
    setFile(null);
    setPicking(true);
    setPickProgress(0);
    try {
      await readFilesWithProgress([candidate], setPickProgress);
      setFile(candidate);
    } catch {
      setError("Unable to read this file. Please try another document.");
    } finally {
      setPicking(false);
    }
  }
  async function continueWithFile() {
    if (!file || busy || picking) return;
    setBusy(true); setError("");
    try { await onFile(file); } catch { setError("Unable to open this file. Please try another document."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4"><label htmlFor={inputId} onDragOver={e => {e.preventDefault();setDragOver(true);}} onDragLeave={() => setDragOver(false)} onDrop={e => {e.preventDefault();setDragOver(false);if (!busy && !picking) pickUp(Array.from(e.dataTransfer.files));}} className={`upload-area ${dragOver ? "is-dragging" : ""} ${picking ? "is-picking" : ""}`}>{picking ? <UploadProgressRing percent={pickProgress} label="Reading file…" /> : <><UploadCloud size={28} /><strong>{file ? "Choose a different file" : title}</strong><span>{hint}</span><span className="upload-browse">Browse files</span></>}<input id={inputId} type="file" accept={accept} disabled={busy || picking} className="sr-only" onChange={e => {const picked = e.target.files ? Array.from(e.target.files) : null; e.target.value=""; pickUp(picked);}} /></label>{!file && <div className="flex justify-center"><GoogleDriveButton mimeTypes={acceptToDriveMimeTypes(accept)} disabled={busy || picking} onFiles={pickUp} onError={setError} /></div>}{error && <p role="alert" className="upload-error">{error}</p>}{file && <div className="file-review"><SelectedFileView key={`${file.name}-${file.size}-${file.lastModified}`} file={file} disabled={busy || picking} onRemove={() => setFile(null)} />{busy ? <div className="file-review-actions"><ProgressBar label="Processing your file…" /></div> : <div className="file-review-actions"><p>Your file is selected. Processing starts when you continue.</p><button type="button" className="primary-button" disabled={picking} onClick={continueWithFile}>Continue<ArrowRight size={16} /></button></div>}</div>}</div>;
}



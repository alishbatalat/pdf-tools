"use client";
import { UploadCloud, FileText, ArrowRight, X } from "lucide-react";
import { useId, useState } from "react";
export default function PdfDropzone({ onFile, title = "Choose a PDF or drop it here", hint = "PDF files", accept = "application/pdf,.pdf" }: { onFile: (file: File) => void; title?: string; hint?: string; accept?: string }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  function select(list: FileList | null) {
    if (!list?.length) return;
    const candidate = list[0];
    const valid = accept.split(",").some(value => { const rule = value.trim().toLowerCase(); return rule.startsWith(".") ? candidate.name.toLowerCase().endsWith(rule) : rule.endsWith("/*") ? candidate.type.startsWith(rule.slice(0,-1)) : candidate.type === rule; });
    if (list.length > 1) { setError("Choose one file at a time."); return; }
    if (!valid) { setError(`Unsupported file format. ${hint}`); return; }
    if (!candidate.size) { setError("This file is empty. Choose another file."); return; }
    setError(""); setFile(candidate);
  }
  async function continueWithFile() {
    if (!file || busy) return;
    setBusy(true); setError("");
    try { await onFile(file); } catch { setError("Unable to open this file. Please try another document."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4"><label htmlFor={inputId} onDragOver={e => {e.preventDefault();setDragOver(true);}} onDragLeave={() => setDragOver(false)} onDrop={e => {e.preventDefault();setDragOver(false);if (!busy) select(e.dataTransfer.files);}} className={`upload-area ${dragOver ? "is-dragging" : ""}`}><UploadCloud size={28} /><strong>{file ? "Choose a different file" : title}</strong><span>{hint}</span><span className="upload-browse">Browse files</span><input id={inputId} type="file" accept={accept} disabled={busy} className="sr-only" onChange={e => {select(e.target.files);e.target.value="";}} /></label>{error && <p role="alert" className="upload-error">{error}</p>}{file && <div className="file-review"><div className="file-review-info"><FileText size={23} /><div><strong>{file.name}</strong><span>{file.size < 1024 * 1024 ? `${Math.max(1,Math.round(file.size/1024))} KB` : `${(file.size/1024/1024).toFixed(1)} MB`} · Ready to continue</span></div><button type="button" aria-label="Remove selected file" disabled={busy} onClick={() => setFile(null)}><X size={18} /></button></div><div className="file-review-actions"><p>Your file is selected. Processing starts when you continue.</p><button type="button" className="primary-button" disabled={busy} onClick={continueWithFile}>{busy ? "Processing…" : "Continue"}<ArrowRight size={16} /></button></div></div>}</div>;
}

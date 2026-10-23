"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, RotateCcw, CheckCircle2, Pencil, Check, X, ArrowRightLeft, Share2, type LucideIcon } from "lucide-react";
import PdfResultPreview from "./PdfResultPreview";
import { getToolByHref } from "@/lib/tools";
import { logActivity } from "@/lib/activity-client";
import { setHandoffFile } from "@/lib/file-handoff";

function splitName(name: string) {
  const match = name.match(/^(.*?)(\.[^.]+)$/);
  return match ? { base: match[1], ext: match[2] } : { base: name, ext: "" };
}

function sanitizeBase(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "").trim();
}

export default function ResultPanel({icon:Icon,title,subtitle,downloadHref,downloadName,onReset}: {icon:LucideIcon;title:string;subtitle?:string;downloadHref:string;downloadName:string;onReset:()=>void}) {
  const { base: originalBase, ext } = splitName(downloadName);
  const [base, setBase] = useState(originalBase);
  const [draft, setDraft] = useState(originalBase);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBase(originalBase);
    setDraft(originalBase);
    setEditing(false);
  }, [downloadName]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const finalName = `${base}${ext}`;
  const pdf = finalName.toLowerCase().endsWith(".pdf");
  const pathname = usePathname();
  const router = useRouter();
  const logged = useRef(false);
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    const tool = getToolByHref(pathname);
    if (tool) logActivity(pathname.replace(/^\/tools\//, ""), tool.title, downloadName);
  }, [pathname, downloadName]);

  function commitRename() {
    const cleaned = sanitizeBase(draft);
    setBase(cleaned || originalBase);
    setEditing(false);
  }
  function cancelRename() {
    setDraft(base);
    setEditing(false);
  }

  const [handingOff, setHandingOff] = useState(false);

  async function continueWithAnotherTool() {
    if (handingOff) return;
    setHandingOff(true);
    try {
      const blob = await fetch(downloadHref).then((r) => r.blob());
      setHandoffFile(new File([blob], finalName, { type: blob.type || "application/pdf" }));
      router.push("/tools?continue=1");
    } catch {
      setHandingOff(false);
    }
  }

  const [canShare, setCanShare] = useState(false);
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    if (!navigator.share || !navigator.canShare) return;
    try {
      const probe = new File([""], finalName, { type: "application/octet-stream" });
      setCanShare(navigator.canShare({ files: [probe] }));
    } catch {
      setCanShare(false);
    }
    // only needs to run once — file-sharing support doesn't change mid-session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function shareFile() {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await fetch(downloadHref).then((r) => r.blob());
      const file = new File([blob], finalName, { type: blob.type || "application/pdf" });
      await navigator.share({ files: [file], title: finalName });
    } catch {
      // user cancelled the share sheet, or sharing failed silently — nothing to surface
    } finally {
      setSharing(false);
    }
  }

  return <div className="result-workspace"><div className="result-summary"><span className="result-status"><CheckCircle2 size={16} /> Processing complete</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}<div className="result-file"><Icon size={23} /><div className="result-file-body">{editing ? <div className="result-file-edit"><input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }} aria-label="File name" /><span className="result-file-ext">{ext}</span><button type="button" onClick={commitRename} aria-label="Save name"><Check size={14} /></button><button type="button" onClick={cancelRename} aria-label="Cancel rename"><X size={14} /></button></div> : <div className="result-file-display"><strong>{finalName}</strong><button type="button" className="rename-trigger" onClick={() => { setDraft(base); setEditing(true); }}><Pencil size={12} />Rename</button></div>}<span>{pdf ? "Review your document below before saving." : "Your file is ready to save."}</span></div></div><div className="result-actions"><a href={downloadHref} download={finalName} className="primary-button"><Download size={17} />Download file</a><button type="button" onClick={onReset}><RotateCcw size={16} className="action-icon-restart" />Start another task</button>{canShare && <button type="button" disabled={sharing} onClick={shareFile}><Share2 size={16} className="action-icon-share" />{sharing ? "Opening…" : "Share"}</button>}{pdf && <button type="button" disabled={handingOff} onClick={continueWithAnotherTool}><ArrowRightLeft size={16} className="action-icon-continue" />{handingOff ? "Preparing…" : "Continue with another tool"}</button>}</div><p className="result-note">The file stays here until you choose to download it. Download it before leaving this page.</p></div>{pdf && <PdfResultPreview url={downloadHref} />}</div>;
}

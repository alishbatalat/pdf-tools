"use client";
import EnlargePreview from "./EnlargePreview";
/* eslint-disable @next/next/no-img-element -- Thumbnails are generated locally from selected files. */
import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { getPdfjs } from "@/lib/pdf-worker";
import { displayFileSize } from "@/lib/file-details";
import ViewToggle, { type ViewMode } from "./ViewToggle";
import "@/app/file-selection.css";

export default function SelectedFileView({file,disabled,onRemove}:{file:File;disabled:boolean;onRemove:()=>void}) {
  const [mode,setMode] = useState<ViewMode>("grid");
  const [preview,setPreview] = useState<{src:string|null;pages:number|null;done:boolean}>({src:null,pages:null,done:false});
  const type = file.name.split(".").pop()?.toUpperCase() || file.type || "FILE";
  const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  useEffect(() => {
    let cancelled = false;
    let imageUrl: string | null = null;
    let destroy: (()=>void) | undefined;
    (async () => {
      let src: string | null = null;
      let pages: number | null = null;
      try {
        if (pdf) {
          const pdfjs = await getPdfjs();
          if(cancelled) return;
          const task = pdfjs.getDocument({data:await file.arrayBuffer()});
          destroy = () => { void task.destroy(); };
          const doc = await task.promise;
          pages = doc.numPages;
          if(cancelled) return;
          const page = await doc.getPage(1);
          const viewport = page.getViewport({scale:.5});
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          await page.render({canvas,viewport}).promise;
          src = canvas.toDataURL("image/png");
        } else if (file.type.startsWith("image/")) {
          imageUrl = URL.createObjectURL(file); src = imageUrl;
        }
      } catch { /* A missing preview does not block processing the selected file. */ }
      finally { destroy?.(); destroy = undefined; }
      if(!cancelled) setPreview({src,pages,done:true});
    })();
    return () => { cancelled = true; destroy?.(); if(imageUrl) URL.revokeObjectURL(imageUrl); };
  },[file,pdf]);
  return <div className="selection-view"><div className="selection-view-toolbar"><strong>Selected file <span>1</span></strong><ViewToggle mode={mode} onChange={setMode} /></div><div className={`selection-items selection-items-${mode}`}><article className="selection-file" tabIndex={0} aria-label={`${file.name}, ${type}, ${displayFileSize(file.size)}${preview.pages ? `, ${preview.pages} pages` : ""}`} onPointerDown={e=>{if(e.pointerType === "touch") e.currentTarget.focus({preventScroll:true});}}><div className="selection-thumbnail">{preview.src ? <><img src={preview.src} alt={pdf ? `First page of ${file.name}` : file.name} /></> : <div className="selection-file-symbol"><FileText size={40} strokeWidth={1.4}/><span>{type}</span><small>{preview.done ? "Document file" : "Preparing preview…"}</small></div>}<div className="selection-details"><span>{type}</span><span>{displayFileSize(file.size)}</span>{preview.pages && <span>{preview.pages} {preview.pages === 1 ? "page" : "pages"} · Preview: page 1</span>}</div></div><div className="selection-file-caption"><strong title={file.name}>{file.name}</strong>{mode === "list" && <span>{type} · {displayFileSize(file.size)}{preview.pages ? ` · ${preview.pages} pages` : ""}</span>}</div><EnlargePreview pdfFile={pdf ? file : undefined} src={preview.src} label={file.name} details={`${type} · ${displayFileSize(file.size)}${pdf ? " · First page preview" : ""}`} /><button className="selection-file-remove" type="button" aria-label={`Remove ${file.name}`} disabled={disabled} onClick={onRemove}><X size={17}/></button></article></div></div>;
}




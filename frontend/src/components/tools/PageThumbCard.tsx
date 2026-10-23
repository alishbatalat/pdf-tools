"use client";
import { useState, type ReactNode } from "react";
import { displayFileSize } from "@/lib/file-details";
import EnlargePreview from "./EnlargePreview";
export default function PageThumbCard({thumbnail,pdfFile,pageIndex,fileSize,label,selected=false,dimmed=false,rotateDeg=0,onClick,overlay}:{thumbnail:string;pdfFile?:File;pageIndex?:number;fileSize?:number;label:string;selected?:boolean;dimmed?:boolean;rotateDeg?:number;onClick?:()=>void;overlay?:ReactNode}) {
  const [showDetails,setShowDetails]=useState(false);
  return <div className={`page-metadata-card page-enlarge-card group relative rounded-xl border-2 bg-surface p-2 ${selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`} data-details={showDetails||undefined} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setShowDetails(false);}}><button type="button" onClick={onClick} onPointerDown={e=>{if(e.pointerType==="touch")setShowDetails(true);}} className="page-thumbnail-action"><span className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface-muted">{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={thumbnail} alt={label} className={`max-h-full max-w-full object-contain ${dimmed ? "opacity-30 grayscale" : ""}`} style={{transform:`rotate(${rotateDeg}deg)`}}/><span className="thumb-hover-overlay"><span className="thumb-chip">{label}</span><span className="thumb-chip">PDF</span>{fileSize!==undefined && <span className="thumb-chip">File: {displayFileSize(fileSize)}</span>}</span></span><span className="mt-1.5 block text-center text-xs font-medium text-muted">{label}</span></button>{overlay && <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{overlay}</div>}<EnlargePreview pdfFile={pdfFile} pageIndex={pageIndex} src={thumbnail} label={label} rotation={rotateDeg} details={`PDF${fileSize!==undefined ? ` · File: ${displayFileSize(fileSize)}` : ""}`}/></div>;
}


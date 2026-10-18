"use client";
import { Download, RotateCcw, CheckCircle2, type LucideIcon } from "lucide-react";
import PdfResultPreview from "./PdfResultPreview";
export default function ResultPanel({icon:Icon,title,subtitle,downloadHref,downloadName,onReset}: {icon:LucideIcon;title:string;subtitle?:string;downloadHref:string;downloadName:string;onReset:()=>void}) {
  const pdf = downloadName.toLowerCase().endsWith(".pdf");
  return <div className="result-workspace"><div className="result-summary"><span className="result-status"><CheckCircle2 size={16} /> Processing complete</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}<div className="result-file"><Icon size={23} /><div><strong>{downloadName}</strong><span>{pdf ? "Review your document below before saving." : "Your file is ready to save."}</span></div></div><div className="result-actions"><a href={downloadHref} download={downloadName} className="primary-button"><Download size={17} />Download file</a><button type="button" onClick={onReset}><RotateCcw size={16} />Start another task</button></div><p className="result-note">The file stays here until you choose to download it. Download it before leaving this page.</p></div>{pdf && <PdfResultPreview url={downloadHref} />}</div>;
}

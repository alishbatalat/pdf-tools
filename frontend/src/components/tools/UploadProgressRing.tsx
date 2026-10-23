import type { CSSProperties } from "react";
export default function UploadProgressRing({percent,label}:{percent:number;label:string}) {
  const value = Number.isFinite(percent) ? Math.min(100,Math.max(0,Math.round(percent))) : 0;
  return <><div className="upload-progress-ring" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} style={{"--pct":value} as CSSProperties}><span aria-hidden="true">{value}%</span></div><strong>{label}</strong><span className="file-reading-caption">Preparing your selection. Processing has not started.</span></>;
}

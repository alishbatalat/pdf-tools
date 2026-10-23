"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Eraser, PenTool, Upload, X } from "lucide-react";
import { describeCameraError, openCameraStream } from "@/lib/camera";
import "@/app/signature.css";

type Tab = "draw" | "upload" | "camera";

export default function SignatureCreator({
  pageThumbnail,
  pageLabel,
  onConfirm,
  onCancel,
}: {
  pageThumbnail: string | null;
  pageLabel: string;
  onConfirm: (dataUrl: string, format: "png" | "jpeg") => void;
  onCancel: () => void;
}) {
  const heading = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("draw");

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  function close() {
    if (dialog.current?.open) dialog.current.close();
    else onCancel();
  }

  return createPortal(
    <dialog
      ref={dialog}
      className="signature-dialog"
      aria-labelledby={heading}
      onClose={onCancel}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="signature-dialog-shell">
        <header>
          <h2 id={heading}>Add your signature</h2>
          <button type="button" aria-label="Close" onClick={close}><X size={20} /></button>
        </header>

        <div className="signature-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "draw"} className={tab === "draw" ? "is-active" : ""} onClick={() => setTab("draw")}>
            <PenTool size={14} /> Draw
          </button>
          <button type="button" role="tab" aria-selected={tab === "upload"} className={tab === "upload" ? "is-active" : ""} onClick={() => setTab("upload")}>
            <Upload size={14} /> Upload
          </button>
          <button type="button" role="tab" aria-selected={tab === "camera"} className={tab === "camera" ? "is-active" : ""} onClick={() => setTab("camera")}>
            <Camera size={14} /> Camera
          </button>
        </div>

        {tab === "draw" && <DrawSignature onConfirm={onConfirm} />}
        {tab === "upload" && <UploadSignature onConfirm={onConfirm} />}
        {tab === "camera" && <CameraSignature onConfirm={onConfirm} active={tab === "camera"} />}

        <div className="signature-page-context">
          <p>Will be placed on:</p>
          <div className="signature-page-preview">
            {pageThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pageThumbnail} alt={pageLabel} />
            ) : (
              <span className="signature-page-preview-empty">{pageLabel}</span>
            )}
          </div>
          <span>{pageLabel}</span>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

function DrawSignature({ onConfirm }: { onConfirm: (dataUrl: string, format: "png" | "jpeg") => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStroke = useRef(false);
  const [empty, setEmpty] = useState(true);

  function getCtx() {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111111";
    ctx.stroke();
    hasStroke.current = true;
    setEmpty(false);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStroke.current = false;
    setEmpty(true);
  }

  function confirm() {
    const canvas = canvasRef.current;
    if (!canvas || !hasStroke.current) return;
    onConfirm(canvas.toDataURL("image/png"), "png");
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={600}
        height={220}
        className="signature-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={clear} className="signature-secondary-btn">
          <Eraser size={14} /> Clear
        </button>
        <button type="button" disabled={empty} onClick={confirm} className="primary-button" style={{ margin: 0 }}>
          Use this signature
        </button>
      </div>
    </div>
  );
}

function UploadSignature({ onConfirm }: { onConfirm: (dataUrl: string, format: "png" | "jpeg") => void }) {
  const inputId = useId();
  const [error, setError] = useState("");

  async function onPicked(file: File) {
    setError("");
    const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    if (!isPng && !isJpeg) {
      setError("Only PNG and JPEG images are supported. A PNG with a transparent background works best for signatures.");
      return;
    }
    const mime = isPng ? "image/png" : "image/jpeg";
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      onConfirm(raw.replace(/^data:[^;]+/, `data:${mime}`), isPng ? "png" : "jpeg");
    };
    reader.onerror = () => setError("Couldn't read that image.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="upload-area" style={{ padding: "28px 16px" }}>
        <Upload size={24} />
        <strong>Upload a signature image</strong>
        <span>PNG with a transparent background works best, JPEG is also fine</span>
        <span className="upload-browse">Browse files</span>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onPicked(file);
          }}
        />
      </label>
      {error && <p role="alert" className="upload-error">{error}</p>}
    </div>
  );
}

function CameraSignature({ onConfirm, active }: { onConfirm: (dataUrl: string, format: "png" | "jpeg") => void; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function run() {
      setError("");
      setReady(false);
      try {
        const stream = await openCameraStream();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        if (!cancelled) setError(`Couldn't access your camera: ${describeCameraError(err)}`);
      }
    }

    void run();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    onConfirm(canvas.toDataURL("image/png"), "png");
  }

  return (
    <div className="space-y-3">
      <div className="signature-camera-frame">
        {error ? (
          <p role="alert" className="upload-error">{error}</p>
        ) : (
          <video ref={videoRef} playsInline muted className="signature-camera-video" />
        )}
      </div>
      <div className="flex justify-end">
        <button type="button" disabled={!ready || !!error} onClick={capture} className="primary-button" style={{ margin: 0 }}>
          <Camera size={16} /> Capture
        </button>
      </div>
      <p className="text-xs text-muted">Sign on a plain sheet of paper and hold it up to the camera, then capture.</p>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  AlertCircle,
  Bold,
  FileSignature,
  GripVertical,
  Image as ImageIcon,
  Italic,
  Maximize2,
  Minimize2,
  Strikethrough,
  Trash2,
  Type,
  Underline,
} from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import { reorderPages } from "@/lib/pdf-operations";
import {
  applyPdfEdits,
  extractTextItems,
  findTextItemAt,
  type EditorElement,
  type ImageEditorElement,
  type TextFontFamily,
  type TextHitItem,
} from "@/lib/pdf-editor";
import PdfDropzone from "./PdfDropzone";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";
import SignatureCreator from "./SignatureCreator";

const EDITOR_RENDER_SCALE = 1.4;
const MIN_SIZE_PCT = 2;

const FONT_CSS: Record<TextFontFamily, string> = {
  "sans-serif": "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  monospace: "'Courier New', monospace",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = src;
  });
}

function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return loadImageElement(dataUrl).then((img) => ({
    width: img.naturalWidth || 1,
    height: img.naturalHeight || 1,
  }));
}

export default function SignPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [textItemsByPage, setTextItemsByPage] = useState<TextHitItem[][]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [activeOriginalIndex, setActiveOriginalIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [dragPage, setDragPage] = useState<number | null>(null);
  const [dragOverPage, setDragOverPage] = useState<number | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { pages, status, error: loadError } = usePdfPages(file, EDITOR_RENDER_SCALE);
  const activeThumb = pages[activeOriginalIndex];
  const pageWidthPt = activeThumb ? activeThumb.width / EDITOR_RENDER_SCALE : 0;
  const pageHeightPt = activeThumb ? activeThumb.height / EDITOR_RENDER_SCALE : 0;
  const pageElements = elements.filter((el) => el.pageIndex === activeOriginalIndex);
  const selected = elements.find((el) => el.id === selectedId) ?? null;
  const selectedText = selected?.type === "text" ? selected : null;

  useEffect(() => {
    if (status === "ready" && pageOrder.length !== pages.length) {
      setPageOrder(pages.map((_, i) => i));
    }
  }, [status, pages, pageOrder.length]);

  useEffect(() => {
    if (selected?.type === "text") textareaRef.current?.focus();
  }, [selectedId, selected?.type]);

  useEffect(() => {
    if (!file) {
      setTextItemsByPage([]);
      return;
    }
    let cancelled = false;
    extractTextItems(file).then((items) => {
      if (!cancelled) setTextItemsByPage(items);
    }).catch(() => {
      if (!cancelled) setTextItemsByPage([]);
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!selectedId) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(input|textarea)$/i.test(target.tagName)) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        removeElement(selectedId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  function addElement(el: EditorElement) {
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  }

  function updateElement(id: string, patch: Partial<EditorElement>) {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...patch } as EditorElement) : el)),
    );
  }

  function removeElement(id: string) {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  function addText(atXPct = 28, atYPct = 42) {
    addElement({
      id: makeId(),
      pageIndex: activeOriginalIndex,
      type: "text",
      text: "Edit this text",
      fontSize: 18,
      fontFamily: "sans-serif",
      color: "#111111",
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      borderColor: null,
      coverColor: null,
      opacity: 1,
      xPct: clamp(atXPct, 0, 56),
      yPct: clamp(atYPct, 0, 90),
      wPct: 44,
      hPct: 10,
    });
  }

  function editExistingText(item: TextHitItem) {
    const padX = item.wPct * 0.02 + 0.3;
    const padY = item.hPct * 0.3;
    addElement({
      id: makeId(),
      pageIndex: activeOriginalIndex,
      type: "text",
      text: item.str,
      fontSize: clamp(Math.round(item.fontSize), 6, 96),
      fontFamily: "sans-serif",
      color: "#111111",
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      borderColor: null,
      coverColor: "#ffffff",
      opacity: 1,
      xPct: clamp(item.xPct - padX, 0, 100),
      yPct: clamp(item.yPct - padY, 0, 100),
      wPct: clamp(item.wPct + padX * 2, MIN_SIZE_PCT, 100),
      hPct: clamp(item.hPct + padY * 2, MIN_SIZE_PCT, 100),
    });
  }

  function handleCanvasDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const container = canvasRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const hit = findTextItemAt(textItemsByPage[activeOriginalIndex] ?? [], xPct, yPct);
    if (hit) {
      editExistingText(hit);
    } else {
      addText(xPct - 22, yPct - 5);
    }
  }

  async function insertImage(dataUrl: string, format: "png" | "jpeg", isSignature: boolean) {
    const { width, height } = await loadImageDimensions(dataUrl);
    const wPct = isSignature ? 30 : 35;
    const hPct = pageWidthPt && pageHeightPt
      ? ((wPct / 100) * pageWidthPt * (height / width) / pageHeightPt) * 100
      : wPct * (height / width);
    addElement({
      id: makeId(),
      pageIndex: activeOriginalIndex,
      type: "image",
      dataUrl,
      format,
      isSignature,
      opacity: 1,
      xPct: 32,
      yPct: isSignature ? 65 : 35,
      wPct,
      hPct: clamp(hPct, MIN_SIZE_PCT, 90),
    } as ImageEditorElement);
  }

  async function onImagePicked(picked: File) {
    const header = new Uint8Array(await picked.slice(0, 8).arrayBuffer());
    const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;

    if (!isPng && !isJpeg) {
      setError(
        "Only PNG and JPEG images are supported. That file isn't actually a PNG or JPEG (even if it's named .jpg) — try converting it first.",
      );
      return;
    }

    const format: "png" | "jpeg" = isPng ? "png" : "jpeg";
    const mime = isPng ? "image/png" : "image/jpeg";
    const reader = new FileReader();
    const rawDataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Couldn't read that image."));
      reader.readAsDataURL(picked);
    });
    const dataUrl = rawDataUrl.replace(/^data:[^;]+/, `data:${mime}`);
    setError(null);
    await insertImage(dataUrl, format, false);
  }

  async function onSignatureConfirm(dataUrl: string, format: "png" | "jpeg") {
    setSignatureOpen(false);
    await insertImage(dataUrl, format, true);
  }

  function movePage(fromVisual: number, toVisual: number) {
    if (fromVisual === toVisual) return;
    setPageOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromVisual, 1);
      next.splice(toVisual, 0, moved);
      return next;
    });
  }

  async function save() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const identityOrder = pageOrder.every((v, i) => v === i);
      let targetFile = file;
      let targetElements = elements;
      if (!identityOrder) {
        const reorderedBlob = await reorderPages(file, pageOrder);
        targetFile = new File([reorderedBlob], file.name, { type: "application/pdf" });
        targetElements = elements.map((el) => ({ ...el, pageIndex: pageOrder.indexOf(el.pageIndex) }));
      }
      const blob = await applyPdfEdits(targetFile, targetElements);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your signed PDF.");
    } finally {
      setWorking(false);
    }
  }

  function reset() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setFile(null);
    setElements([]);
    setPageOrder([]);
    setActiveOriginalIndex(0);
    setSelectedId(null);
    setMaximized(false);
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={FileSignature}
        title="PDF signed"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="signed.pdf"
        onReset={reset}
      />
    );
  }

  if (!file) {
    return <PdfDropzone onFile={setFile} title="Drop a PDF here, or click to browse" />;
  }

  const activeVisualIndex = pageOrder.indexOf(activeOriginalIndex);

  return (
    <div className={maximized ? "sign-pdf-maximized" : ""}>
      <div className="space-y-6">
        {status === "loading" && <ProgressBar label="Reading pages…" />}

        {(error || loadError) && (
          <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>{error ?? loadError}</span>
          </div>
        )}

        {status === "ready" && activeThumb && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setSignatureOpen(true)} className="editor-tool-btn">
                  <FileSignature size={15} /> Signature
                </button>
                <button type="button" onClick={() => addText()} className="editor-tool-btn">
                  <Type size={15} /> Text
                </button>
                <button type="button" onClick={() => imageInputRef.current?.click()} className="editor-tool-btn">
                  <ImageIcon size={15} /> Image
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => {
                    const picked = e.target.files?.[0];
                    e.target.value = "";
                    if (picked) void onImagePicked(picked);
                  }}
                />
              </div>

              <button
                type="button"
                aria-label={maximized ? "Exit maximized view" : "Maximize editor"}
                aria-pressed={maximized}
                onClick={() => setMaximized((v) => !v)}
                className="editor-tool-btn"
              >
                {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                {maximized ? "Exit full view" : "Maximize"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[88px_1fr_260px]">
              <aside className="sign-pdf-page-rail" aria-label="Pages — drag to reorder">
                {pageOrder.map((origIndex, visualIndex) => {
                  const thumb = pages[origIndex];
                  if (!thumb) return null;
                  return (
                    <button
                      key={origIndex}
                      type="button"
                      draggable
                      onDragStart={() => setDragPage(visualIndex)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverPage(visualIndex); }}
                      onDragLeave={() => setDragOverPage((cur) => (cur === visualIndex ? null : cur))}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragPage !== null) movePage(dragPage, visualIndex);
                        setDragPage(null);
                        setDragOverPage(null);
                      }}
                      onDragEnd={() => { setDragPage(null); setDragOverPage(null); }}
                      onClick={() => { setActiveOriginalIndex(origIndex); setSelectedId(null); }}
                      className={`sign-pdf-page-thumb ${activeOriginalIndex === origIndex ? "is-active" : ""} ${
                        dragPage === visualIndex ? "is-dragging" : ""
                      } ${dragOverPage === visualIndex && dragPage !== visualIndex ? "is-dragover" : ""}`}
                    >
                      <GripVertical size={11} className="drag-handle" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb.thumbnail} alt={`Page ${visualIndex + 1}`} />
                      <span>{visualIndex + 1}</span>
                    </button>
                  );
                })}
              </aside>

              <div
                ref={canvasRef}
                onPointerDown={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
                onDoubleClick={handleCanvasDoubleClick}
                className="relative mx-auto w-full touch-none select-none overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                style={{
                  aspectRatio: `${pageWidthPt} / ${pageHeightPt}`,
                  maxWidth: 620,
                  containerType: "inline-size",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeThumb.thumbnail}
                  alt={`Page ${activeVisualIndex + 1} preview`}
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />

                {pageElements.map((el, i) => (
                  <ElementBox
                    key={el.id}
                    element={el}
                    zIndex={i + 1}
                    pageWidthPt={pageWidthPt}
                    selected={selectedId === el.id}
                    containerRef={canvasRef}
                    onSelect={() => setSelectedId(el.id)}
                    onChange={(patch) => updateElement(el.id, patch)}
                    onDelete={() => removeElement(el.id)}
                  />
                ))}
              </div>

              <aside className="rounded-xl border border-border bg-surface p-4">
                {!selected && (
                  <p className="text-xs text-muted">
                    Click <strong>Signature</strong> to draw, upload, or photograph your signature.
                    Double-click existing text to edit it, or a blank spot to add new text. Drag a
                    page thumbnail on the left to reorder pages. Click an element to edit it — drag
                    to move, use the bottom-right handle to resize.
                  </p>
                )}

                {selectedText && (
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-muted">
                      Text
                      <textarea
                        ref={textareaRef}
                        value={selectedText.text}
                        onChange={(e) => updateElement(selectedText.id, { text: e.target.value })}
                        rows={3}
                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                      />
                    </label>

                    <label className="block text-xs font-medium text-muted">
                      Font family
                      <select
                        value={selectedText.fontFamily}
                        onChange={(e) => updateElement(selectedText.id, { fontFamily: e.target.value as TextFontFamily })}
                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                      >
                        <option value="sans-serif">Sans-Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-label="Bold text"
                        aria-pressed={selectedText.bold}
                        onClick={() => updateElement(selectedText.id, { bold: !selectedText.bold })}
                        className={`editor-toggle-btn ${selectedText.bold ? "is-active" : ""}`}
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Italic text"
                        aria-pressed={selectedText.italic}
                        onClick={() => updateElement(selectedText.id, { italic: !selectedText.italic })}
                        className={`editor-toggle-btn ${selectedText.italic ? "is-active" : ""}`}
                      >
                        <Italic size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Underline text"
                        aria-pressed={selectedText.underline}
                        onClick={() => updateElement(selectedText.id, { underline: !selectedText.underline })}
                        className={`editor-toggle-btn ${selectedText.underline ? "is-active" : ""}`}
                      >
                        <Underline size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Strikethrough text"
                        aria-pressed={selectedText.strikethrough}
                        onClick={() => updateElement(selectedText.id, { strikethrough: !selectedText.strikethrough })}
                        className={`editor-toggle-btn ${selectedText.strikethrough ? "is-active" : ""}`}
                      >
                        <Strikethrough size={14} />
                      </button>
                    </div>

                    <label className="block text-xs font-medium text-muted">
                      Font size ({selectedText.fontSize}pt)
                      <input
                        type="range"
                        min={8}
                        max={96}
                        value={selectedText.fontSize}
                        onChange={(e) => updateElement(selectedText.id, { fontSize: Number(e.target.value) })}
                        className="mt-1.5 w-full"
                      />
                    </label>

                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-xs font-medium text-muted">
                        Fill / text color
                        <input
                          type="color"
                          aria-label="Text color"
                          value={selectedText.color}
                          onChange={(e) => updateElement(selectedText.id, { color: e.target.value })}
                          className="h-8 w-8 shrink-0 rounded border border-border bg-background p-0.5"
                        />
                      </label>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-muted">
                      <input
                        type="checkbox"
                        checked={!!selectedText.borderColor}
                        onChange={(e) =>
                          updateElement(selectedText.id, { borderColor: e.target.checked ? "#111111" : null })
                        }
                      />
                      Border / drawing color
                      {selectedText.borderColor && (
                        <input
                          type="color"
                          value={selectedText.borderColor}
                          onChange={(e) => updateElement(selectedText.id, { borderColor: e.target.value })}
                          className="h-7 w-7 rounded border border-border bg-background p-0.5"
                        />
                      )}
                    </label>

                    <label className="block text-xs font-medium text-muted">
                      Opacity ({Math.round((selectedText.opacity ?? 1) * 100)}%)
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={Math.round((selectedText.opacity ?? 1) * 100)}
                        onChange={(e) => updateElement(selectedText.id, { opacity: Number(e.target.value) / 100 })}
                        className="mt-1.5 w-full"
                      />
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-muted">
                      <input
                        type="checkbox"
                        checked={!!selectedText.coverColor}
                        onChange={(e) =>
                          updateElement(selectedText.id, { coverColor: e.target.checked ? "#ffffff" : null })
                        }
                      />
                      Cover background
                      {selectedText.coverColor && (
                        <input
                          type="color"
                          value={selectedText.coverColor}
                          onChange={(e) => updateElement(selectedText.id, { coverColor: e.target.value })}
                          className="h-7 w-7 rounded border border-border bg-background p-0.5"
                        />
                      )}
                    </label>
                  </div>
                )}

                {selected?.type === "image" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted">
                      {selected.isSignature ? "Signature" : "Image"} — drag to move, or use the handle
                      to resize. Delete and re-add to swap it.
                    </p>
                    <label className="block text-xs font-medium text-muted">
                      Opacity ({Math.round((selected.opacity ?? 1) * 100)}%)
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={Math.round((selected.opacity ?? 1) * 100)}
                        onChange={(e) => updateElement(selected.id, { opacity: Number(e.target.value) / 100 })}
                        className="mt-1.5 w-full"
                      />
                    </label>
                  </div>
                )}

                {(selected?.type === "rect" || selected?.type === "line") && (
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-xs font-medium text-muted">
                      Color
                      <input
                        type="color"
                        value={selected.color}
                        onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                        className="h-8 w-8 rounded border border-border bg-background p-0.5"
                      />
                    </label>
                    <label className="block text-xs font-medium text-muted">
                      Stroke width ({selected.strokeWidth}pt)
                      <input
                        type="range"
                        min={1}
                        max={12}
                        value={selected.strokeWidth}
                        onChange={(e) => updateElement(selected.id, { strokeWidth: Number(e.target.value) })}
                        className="mt-1.5 w-full"
                      />
                    </label>
                  </div>
                )}

                {selected && (
                  <button
                    type="button"
                    onClick={() => removeElement(selected.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-xs font-medium text-accent"
                  >
                    <Trash2 size={13} /> Delete element
                  </button>
                )}
              </aside>
            </div>

            {working ? (
              <ProgressBar label="Saving your signed PDF…" />
            ) : (
              <button
                type="button"
                disabled={elements.length === 0}
                onClick={save}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileSignature size={16} />
                Save signed PDF
              </button>
            )}
          </>
        )}
      </div>

      {signatureOpen && (
        <SignatureCreator
          pageThumbnail={activeThumb?.thumbnail ?? null}
          pageLabel={`Page ${activeVisualIndex + 1} of ${pages.length}`}
          onConfirm={onSignatureConfirm}
          onCancel={() => setSignatureOpen(false)}
        />
      )}
    </div>
  );
}

function ElementBox({
  element,
  zIndex,
  pageWidthPt,
  selected,
  containerRef,
  onSelect,
  onChange,
  onDelete,
}: {
  element: EditorElement;
  zIndex: number;
  pageWidthPt: number;
  selected: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onChange: (patch: Partial<EditorElement>) => void;
  onDelete: () => void;
}) {
  function handleDragStart(e: React.PointerEvent) {
    e.stopPropagation();
    onSelect();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = element.xPct;
    const startY = element.yPct;

    function move(ev: PointerEvent) {
      const dxPct = ((ev.clientX - startClientX) / rect.width) * 100;
      const dyPct = ((ev.clientY - startClientY) / rect.height) * 100;
      onChange({
        xPct: clamp(startX + dxPct, 0, 100 - element.wPct),
        yPct: clamp(startY + dyPct, 0, 100 - element.hPct),
      });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function handleResizeStart(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startW = element.wPct;
    const startH = element.hPct;

    function move(ev: PointerEvent) {
      const dwPct = ((ev.clientX - startClientX) / rect.width) * 100;
      const dhPct = ((ev.clientY - startClientY) / rect.height) * 100;
      onChange({
        wPct: clamp(startW + dwPct, MIN_SIZE_PCT, 100 - element.xPct),
        hPct: clamp(startH + dhPct, MIN_SIZE_PCT, 100 - element.yPct),
      });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const cqw = (pt: number) => (pageWidthPt ? `${(pt / pageWidthPt) * 100}cqw` : `${pt}px`);
  const opacity = element.opacity ?? 1;

  return (
    <div
      onPointerDown={handleDragStart}
      className={`pdf-editor-element absolute cursor-move ${selected ? "outline outline-2 outline-primary" : "outline outline-1 outline-transparent hover:outline-primary/40"}`}
      style={{
        left: `${element.xPct}%`,
        top: `${element.yPct}%`,
        width: `${element.wPct}%`,
        height: `${element.hPct}%`,
        zIndex,
        opacity,
      }}
    >
      {element.type === "text" && (
        <div
          className="h-full w-full overflow-hidden"
          style={{
            backgroundColor: element.coverColor ?? "transparent",
            color: element.color,
            fontWeight: element.bold ? 700 : 400,
            fontStyle: element.italic ? "italic" : "normal",
            fontFamily: FONT_CSS[element.fontFamily] ?? FONT_CSS["sans-serif"],
            fontSize: cqw(element.fontSize),
            lineHeight: 1.25,
            whiteSpace: "pre-wrap",
            textDecoration: [element.underline && "underline", element.strikethrough && "line-through"]
              .filter(Boolean)
              .join(" ") || "none",
            border: element.borderColor ? `1px solid ${element.borderColor}` : undefined,
          }}
        >
          {element.text}
        </div>
      )}

      {element.type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={element.dataUrl} alt="" draggable={false} className="h-full w-full object-fill" />
      )}

      {element.type === "rect" && (
        <div
          className="h-full w-full"
          style={{
            border: `${cqw(element.strokeWidth)} solid ${element.color}`,
            backgroundColor: element.fillColor ?? "transparent",
          }}
        />
      )}

      {element.type === "line" && (
        <div className="relative h-full w-full">
          <div
            className="absolute left-0 top-1/2 w-full -translate-y-1/2"
            style={{ height: cqw(element.strokeWidth), backgroundColor: element.color }}
          />
        </div>
      )}

      {selected && (
        <>
          <button
            type="button"
            aria-label="Delete element"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete}
            className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow"
          >
            <Trash2 size={11} />
          </button>
          <div
            onPointerDown={handleResizeStart}
            className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border border-background bg-primary"
          />
        </>
      )}
    </div>
  );
}

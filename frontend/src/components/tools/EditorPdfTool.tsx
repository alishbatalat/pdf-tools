"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  AlertCircle,
  Bold,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Italic,
  Minus,
  PenSquare,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { usePdfPages } from "@/hooks/usePdfPages";
import {
  applyPdfEdits,
  extractTextItems,
  findTextItemAt,
  type EditorElement,
  type ImageEditorElement,
  type TextHitItem,
} from "@/lib/pdf-editor";
import PdfDropzone from "./PdfDropzone";
import ResultPanel from "./ResultPanel";

const EDITOR_RENDER_SCALE = 1.4; // thumbnail resolution for the editing canvas only; the saved PDF stays vector
const MIN_SIZE_PCT = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = dataUrl;
  });
}

export default function EditorPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [textItemsByPage, setTextItemsByPage] = useState<TextHitItem[][]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { pages, status, error: loadError } = usePdfPages(file, EDITOR_RENDER_SCALE);
  const activeThumb = pages[activePageIndex];
  const pageWidthPt = activeThumb ? activeThumb.width / EDITOR_RENDER_SCALE : 0;
  const pageHeightPt = activeThumb ? activeThumb.height / EDITOR_RENDER_SCALE : 0;
  const pageElements = elements.filter((el) => el.pageIndex === activePageIndex);
  const selected = elements.find((el) => el.id === selectedId) ?? null;

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
      pageIndex: activePageIndex,
      type: "text",
      text: "Edit this text",
      fontSize: 18,
      color: "#111111",
      bold: false,
      italic: false,
      coverColor: null,
      xPct: clamp(atXPct, 0, 56),
      yPct: clamp(atYPct, 0, 90),
      wPct: 44,
      hPct: 10,
    });
  }

  /** Replaces an existing line of PDF text: covers it with a matching box and drops an editable copy on top. */
  function editExistingText(item: TextHitItem) {
    const padX = item.wPct * 0.02 + 0.3;
    const padY = item.hPct * 0.3;
    addElement({
      id: makeId(),
      pageIndex: activePageIndex,
      type: "text",
      text: item.str,
      fontSize: clamp(Math.round(item.fontSize), 6, 96),
      color: "#111111",
      bold: false,
      italic: false,
      coverColor: "#ffffff",
      xPct: clamp(item.xPct - padX, 0, 100),
      yPct: clamp(item.yPct - padY, 0, 100),
      wPct: clamp(item.wPct + padX * 2, MIN_SIZE_PCT, 100),
      hPct: clamp(item.hPct + padY * 2, MIN_SIZE_PCT, 100),
    });
  }

  function handleCanvasDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Ignore double-clicks that land on an existing element — that's handled by selection instead.
    if (e.target !== e.currentTarget) return;
    const container = canvasRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const hit = findTextItemAt(textItemsByPage[activePageIndex] ?? [], xPct, yPct);
    if (hit) {
      editExistingText(hit);
    } else {
      addText(xPct - 22, yPct - 5);
    }
  }

  function addRect() {
    addElement({
      id: makeId(),
      pageIndex: activePageIndex,
      type: "rect",
      color: "#dc2626",
      strokeWidth: 2,
      fillColor: null,
      xPct: 30,
      yPct: 38,
      wPct: 40,
      hPct: 18,
    });
  }

  function addLine() {
    addElement({
      id: makeId(),
      pageIndex: activePageIndex,
      type: "line",
      color: "#dc2626",
      strokeWidth: 2,
      fillColor: null,
      xPct: 25,
      yPct: 48,
      wPct: 50,
      hPct: 3,
    });
  }

  async function onImagePicked(picked: File) {
    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Couldn't read that image."));
      reader.readAsDataURL(picked);
    });
    const { width, height } = await loadImageDimensions(dataUrl);
    const wPct = 35;
    const hPct = pageWidthPt && pageHeightPt
      ? ((wPct / 100) * pageWidthPt * (height / width) / pageHeightPt) * 100
      : wPct;
    const format: ImageEditorElement["format"] = picked.type === "image/png" ? "png" : "jpeg";
    addElement({
      id: makeId(),
      pageIndex: activePageIndex,
      type: "image",
      dataUrl,
      format,
      xPct: 32,
      yPct: 35,
      wPct,
      hPct: clamp(hPct, MIN_SIZE_PCT, 90),
    });
  }

  async function save() {
    if (!file) return;
    setWorking(true);
    setError(null);
    try {
      const blob = await applyPdfEdits(file, elements);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your edits to this PDF.");
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
    setActivePageIndex(0);
    setSelectedId(null);
    setError(null);
  }

  if (resultUrl) {
    return (
      <ResultPanel
        icon={PenSquare}
        title="PDF updated"
        subtitle="This happened entirely in your browser."
        downloadHref={resultUrl}
        downloadName="edited.pdf"
        onReset={reset}
      />
    );
  }

  if (!file) {
    return <PdfDropzone onFile={setFile} title="Drop a PDF here, or click to browse" />;
  }

  return (
    <div className="space-y-6">
      {status === "loading" && <p className="text-sm text-muted">Reading pages&hellip;</p>}

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
              <button type="button" onClick={() => addText()} className="editor-tool-btn">
                <Type size={15} /> Text
              </button>
              <button type="button" onClick={() => imageInputRef.current?.click()} className="editor-tool-btn">
                <ImageIcon size={15} /> Image
              </button>
              <button type="button" onClick={addRect} className="editor-tool-btn">
                <Square size={15} /> Rectangle
              </button>
              <button type="button" onClick={addLine} className="editor-tool-btn">
                <Minus size={15} /> Line
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

            <div className="flex items-center gap-2 text-sm text-muted">
              <button
                type="button"
                aria-label="Previous page"
                disabled={activePageIndex === 0}
                onClick={() => { setActivePageIndex((i) => i - 1); setSelectedId(null); }}
                className="rounded-md border border-border p-1.5 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span aria-live="polite">Page {activePageIndex + 1} of {pages.length}</span>
              <button
                type="button"
                aria-label="Next page"
                disabled={activePageIndex === pages.length - 1}
                onClick={() => { setActivePageIndex((i) => i + 1); setSelectedId(null); }}
                className="rounded-md border border-border p-1.5 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
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
              {/* client-rendered page preview, not a remote image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeThumb.thumbnail}
                alt={`Page ${activePageIndex + 1} preview`}
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
                  Double-click existing text on the page to edit it, or double-click a blank spot
                  to drop a new text box there. You can also use the toolbar to add an element.
                  Click an element to edit it — drag to move, use the bottom-right handle to
                  resize.
                </p>
              )}

              {selected?.type === "text" && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-muted">
                    Text
                    <textarea
                      ref={textareaRef}
                      value={selected.text}
                      onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                      rows={3}
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={selected.bold}
                      onClick={() => updateElement(selected.id, { bold: !selected.bold })}
                      className={`editor-toggle-btn ${selected.bold ? "is-active" : ""}`}
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      type="button"
                      aria-pressed={selected.italic}
                      onClick={() => updateElement(selected.id, { italic: !selected.italic })}
                      className={`editor-toggle-btn ${selected.italic ? "is-active" : ""}`}
                    >
                      <Italic size={14} />
                    </button>
                    <input
                      type="color"
                      aria-label="Text color"
                      value={selected.color}
                      onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                      className="h-8 w-8 shrink-0 rounded border border-border bg-background p-0.5"
                    />
                  </div>

                  <label className="block text-xs font-medium text-muted">
                    Font size ({selected.fontSize}pt)
                    <input
                      type="range"
                      min={8}
                      max={96}
                      value={selected.fontSize}
                      onChange={(e) => updateElement(selected.id, { fontSize: Number(e.target.value) })}
                      className="mt-1.5 w-full"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-muted">
                    <input
                      type="checkbox"
                      checked={!!selected.coverColor}
                      onChange={(e) =>
                        updateElement(selected.id, { coverColor: e.target.checked ? "#ffffff" : null })
                      }
                    />
                    Cover background
                    {selected.coverColor && (
                      <input
                        type="color"
                        value={selected.coverColor}
                        onChange={(e) => updateElement(selected.id, { coverColor: e.target.value })}
                        className="h-7 w-7 rounded border border-border bg-background p-0.5"
                      />
                    )}
                  </label>
                  {selected.coverColor && (
                    <p className="text-[11px] leading-relaxed text-muted">
                      Paints over whatever is beneath this box before drawing the text — use it to
                      replace existing PDF text. Match the color to the page background.
                    </p>
                  )}
                </div>
              )}

              {selected?.type === "image" && (
                <p className="text-xs text-muted">
                  Drag to move, or use the handle to resize. Delete and re-add to swap the image.
                </p>
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

                  {selected.type === "rect" && (
                    <label className="flex items-center gap-2 text-xs font-medium text-muted">
                      <input
                        type="checkbox"
                        checked={!!selected.fillColor}
                        onChange={(e) =>
                          updateElement(selected.id, { fillColor: e.target.checked ? "#fde68a" : null })
                        }
                      />
                      Fill
                      {selected.fillColor && (
                        <input
                          type="color"
                          value={selected.fillColor}
                          onChange={(e) => updateElement(selected.id, { fillColor: e.target.value })}
                          className="h-7 w-7 rounded border border-border bg-background p-0.5"
                        />
                      )}
                    </label>
                  )}
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

          <button
            type="button"
            disabled={elements.length === 0 || working}
            onClick={save}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PenSquare size={16} />
            {working ? "Saving…" : "Save changes"}
          </button>
        </>
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
            fontSize: cqw(element.fontSize),
            lineHeight: 1.25,
            whiteSpace: "pre-wrap",
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

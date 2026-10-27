"use client";

import {
  AlertCircle,
  ArrowUpToLine,
  Copy,
  FilePlus2,
  FileStack,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Shuffle,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { assemblePages, type AssembleItem } from "@/lib/pdf-operations";
import { getPdfjs } from "@/lib/pdf-worker";
import GoogleDriveButton from "./GoogleDriveButton";
import EnlargePreview from "./EnlargePreview";
import ProgressBar from "./ProgressBar";
import ResultPanel from "./ResultPanel";

interface AssemblePage {
  id: string;
  kind: "pdf" | "image" | "blank";
  file?: File;
  pageIndex?: number;
  sourceLabel: string;
  thumbnail: string | "loading";
  rotation: number;
}

type ViewMode = "grid" | "list";
type Status = "idle" | "saving" | "done" | "error";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AssemblePdfTool() {
  const [pages, setPages] = useState<AssemblePage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const inputId = useId();
  const addMoreInputId = useId();
  const resultUrlRef = useRef<string | null>(null);

  async function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.name.toLowerCase().endsWith(".pdf") ||
        f.type.startsWith("image/"),
    );
    if (incoming.length === 0) return;
    setError(null);

    for (const file of incoming) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        const url = URL.createObjectURL(file);
        setPages((prev) => [
          ...prev,
          { id: makeId(), kind: "image", file, sourceLabel: file.name, thumbnail: url, rotation: 0 },
        ]);
        continue;
      }

      try {
        const pdfjsLib = await getPdfjs();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const placeholders: AssemblePage[] = Array.from({ length: pdf.numPages }, (_, i) => ({
          id: makeId(),
          kind: "pdf",
          file,
          pageIndex: i,
          sourceLabel: `${file.name} · p${i + 1}`,
          thumbnail: "loading",
          rotation: 0,
        }));
        setPages((prev) => [...prev, ...placeholders]);

        for (const placeholder of placeholders) {
          const page = await pdf.getPage((placeholder.pageIndex ?? 0) + 1);
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, viewport }).promise;
          const thumbnail = canvas.toDataURL("image/png");
          setPages((prev) => prev.map((p) => (p.id === placeholder.id ? { ...p, thumbnail } : p)));
        }
      } catch {
        setError(`"${file.name}" couldn't be read as a PDF.`);
      }
    }
  }

  function addBlankPage() {
    setPages((prev) => [
      ...prev,
      { id: makeId(), kind: "blank", sourceLabel: "Blank page", thumbnail: "loading", rotation: 0 },
    ]);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reorderTo(from: number, to: number) {
    if (from === to) return;
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function moveSelectedToTop() {
    setPages((prev) => {
      const picked = prev.filter((p) => selected.has(p.id));
      const rest = prev.filter((p) => !selected.has(p.id));
      return [...picked, ...rest];
    });
  }

  function shuffleOrder() {
    setPages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }

  function rotateSelected(delta: number) {
    setPages((prev) =>
      prev.map((p) => (selected.has(p.id) ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p)),
    );
  }

  function duplicateSelected() {
    setPages((prev) => {
      const next: AssemblePage[] = [];
      for (const p of prev) {
        next.push(p);
        if (selected.has(p.id)) next.push({ ...p, id: makeId() });
      }
      return next;
    });
  }

  function deleteSelected() {
    setPages((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
  }

  async function handleSave() {
    if (pages.length === 0) return;
    setStatus("saving");
    setError(null);
    try {
      const items: AssembleItem[] = pages.map((p) =>
        p.kind === "pdf"
          ? { kind: "pdf", file: p.file as File, pageIndex: p.pageIndex ?? 0, rotation: p.rotation }
          : p.kind === "image"
            ? { kind: "image", file: p.file as File, rotation: p.rotation }
            : { kind: "blank", rotation: p.rotation },
      );
      const blob = await assemblePages(items);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while saving.");
      setStatus("error");
    }
  }

  function reset() {
    pages.forEach((p) => {
      if (p.kind === "image" && typeof p.thumbnail === "string") URL.revokeObjectURL(p.thumbnail);
    });
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setPages([]);
    setSelected(new Set());
    setStatus("idle");
    setError(null);
  }

  const hasSelection = selected.size > 0;

  if (status === "done" && resultUrl) {
    return (
      <ResultPanel
        icon={FileStack}
        title={`Assembled ${pages.length} page${pages.length === 1 ? "" : "s"} into one PDF`}
        subtitle="Processed in your browser."
        downloadHref={resultUrl}
        downloadName="assembled.pdf"
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {pages.length === 0 ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(Array.from(e.dataTransfer.files));
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center  ${
            dragOver ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/40"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <UploadCloud size={22} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Drop PDFs or images here, or click to browse</p>
            <p className="mt-1 text-xs text-muted">
              Add several files &mdash; every page lands in one workspace you can rearrange freely.
            </p>
          </div>
          <input
            id={inputId}
            type="file"
            accept="application/pdf,.pdf,image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              const picked = e.target.files ? Array.from(e.target.files) : [];
              e.target.value = "";
              if (picked.length) addFiles(picked);
            }}
          />
        </label>
      ) : (
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-surface p-2">
          <label htmlFor={addMoreInputId} className="assemble-tool-btn" title="Add files">
            <FilePlus2 size={16} />
            <input
              id={addMoreInputId}
              type="file"
              accept="application/pdf,.pdf,image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" title="Add blank page" onClick={addBlankPage} className="assemble-tool-btn">
            <Plus size={16} />
          </button>
          <span className="mx-1 h-6 w-px bg-border" />
          <button
            type="button"
            title="Move selected to top"
            disabled={!hasSelection}
            onClick={moveSelectedToTop}
            className="assemble-tool-btn"
          >
            <ArrowUpToLine size={16} />
          </button>
          <button
            type="button"
            title="Shuffle page order"
            disabled={pages.length < 2}
            onClick={shuffleOrder}
            className="assemble-tool-btn"
          >
            <Shuffle size={16} />
          </button>
          <span className="mx-1 h-6 w-px bg-border" />
          <button
            type="button"
            title="Rotate left"
            disabled={!hasSelection}
            onClick={() => rotateSelected(-90)}
            className="assemble-tool-btn"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            title="Rotate right"
            disabled={!hasSelection}
            onClick={() => rotateSelected(90)}
            className="assemble-tool-btn"
          >
            <RotateCw size={16} />
          </button>
          <button
            type="button"
            title="Duplicate selected"
            disabled={!hasSelection}
            onClick={duplicateSelected}
            className="assemble-tool-btn"
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            title="Delete selected"
            disabled={!hasSelection}
            onClick={deleteSelected}
            className="assemble-tool-btn hover:text-accent"
          >
            <Trash2 size={16} />
          </button>
          <span className="mx-1 h-6 w-px bg-border" />
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`flex h-7 w-7 items-center justify-center rounded-md ${
                viewMode === "list" ? "bg-primary-soft text-primary" : "text-muted"
              }`}
            >
              <List size={14} />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`flex h-7 w-7 items-center justify-center rounded-md ${
                viewMode === "grid" ? "bg-primary-soft text-primary" : "text-muted"
              }`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              disabled={status === "saving"}
              onClick={handleSave}
              title="Save"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={14} />
              Save
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <GoogleDriveButton mimeTypes={["application/pdf", "image/jpeg", "image/png"]} multiple onFiles={addFiles} onError={setError} />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-foreground">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      {pages.length > 0 && (
        <>
          <p className="text-xs text-muted">
            {pages.length} page{pages.length === 1 ? "" : "s"} &middot; drag to reorder, click to select, then
            use the toolbar above.
          </p>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pages.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(index);
                  }}
                  onDragLeave={() => setDragOverIndex((cur) => (cur === index ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorderTo(dragIndex, index);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onClick={() => toggleSelect(item.id)}
                  className={`queue-row relative cursor-pointer overflow-hidden rounded-xl border-2 bg-background p-2  ${
                    selected.has(item.id) ? "border-primary ring-2 ring-primary/30" : "border-border"
                  } ${dragIndex === index ? "is-dragging" : ""} ${
                    dragOverIndex === index && dragIndex !== index ? "is-dragover" : ""
                  }`}
                >
                  <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
                    {item.thumbnail === "loading" ? (
                      <Loader2 size={20} className="animate-spin text-muted" />
                    ) : item.kind === "blank" ? (
                      <div className="h-full w-full bg-white" />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnail}
                          alt={item.sourceLabel}
                          className="max-h-full max-w-full object-contain"
                          style={{ transform: `rotate(${item.rotation}deg)` }}
                        />
                        <EnlargePreview
                          pdfFile={item.kind === "pdf" ? item.file : undefined}
                          pageIndex={item.pageIndex}
                          src={item.thumbnail}
                          label={item.sourceLabel}
                          rotation={item.rotation}
                          details={item.sourceLabel}
                        />
                      </>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-[10px] font-semibold text-foreground shadow">
                      {index + 1}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-center text-xs font-medium text-foreground">
                    {item.sourceLabel}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {pages.map((item, index) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(index);
                  }}
                  onDragLeave={() => setDragOverIndex((cur) => (cur === index ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorderTo(dragIndex, index);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onClick={() => toggleSelect(item.id)}
                  className={`queue-row flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2  ${
                    selected.has(item.id) ? "border-primary bg-primary-soft" : "border-border bg-background"
                  } ${dragIndex === index ? "is-dragging" : ""} ${
                    dragOverIndex === index && dragIndex !== index ? "is-dragover" : ""
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-muted">
                    {item.thumbnail === "loading" ? (
                      <Loader2 size={16} className="animate-spin text-muted" />
                    ) : item.kind === "blank" ? (
                      <span className="h-full w-full bg-white" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt={item.sourceLabel}
                        className="max-h-full max-w-full object-contain"
                        style={{ transform: `rotate(${item.rotation}deg)` }}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {item.sourceLabel}
                  </span>
                  {item.rotation !== 0 && (
                    <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                      {item.rotation}&deg;
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {status === "saving" && <ProgressBar label="Assembling your PDF…" />}
        </>
      )}
    </div>
  );
}

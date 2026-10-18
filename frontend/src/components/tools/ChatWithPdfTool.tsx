"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, MessageSquareText, Send } from "lucide-react";
import { extractPdfText } from "@/lib/pdf-text";
import { askAboutDocument, type ChatTurn } from "@/lib/ai-client";
import PdfDropzone from "./PdfDropzone";

export default function ChatWithPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "instant" });
  }, [history, asking]);

  async function handleFile(selected: File) {
    setFile(selected);
    setError(null);
    setReading(true);
    try {
      const text = await extractPdfText(selected);
      if (!text.trim()) {
        throw new Error("No extractable text found — this PDF may be a scanned image.");
      }
      setDocumentText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read this PDF.");
      setFile(null);
    } finally {
      setReading(false);
    }
  }

  async function sendQuestion() {
    const question = input.trim();
    if (!question || !documentText || asking) return;
    setInput("");
    setError(null);
    const nextHistory: ChatTurn[] = [...history, { role: "user", text: question }];
    setHistory(nextHistory);
    setAsking(true);
    try {
      const { answer } = await askAboutDocument(documentText, nextHistory);
      setHistory((prev) => [...prev, { role: "model", text: answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get an answer.");
      setHistory((prev) => prev.slice(0, -1)); // drop the unanswered question
      setInput(question);
    } finally {
      setAsking(false);
    }
  }

  if (!file) {
    return (
      <div className="space-y-6">
        <PdfDropzone onFile={handleFile} title="Drop a PDF here, or click to browse" />
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  if (reading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-14 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted">Reading document&hellip;</p>
      </div>
    );
  }

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <MessageSquareText size={16} />
        </span>
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {history.length === 0 && (
          <p className="text-sm text-muted">Ask anything about this document to get started.</p>
        )}
        <>
          {history.map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  turn.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-muted text-foreground"
                }`}
              >
                {turn.text}
              </div>
            </div>
          ))}
        </>
        {asking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-surface-muted px-4 py-3">
              <span role="status" className="text-sm text-muted">Preparing an answer…</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-5 mb-2 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-accent" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendQuestion();
            }
          }}
          placeholder="Ask a question about this document&hellip;"
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
        />
        <button
          type="button"
          disabled={!input.trim() || asking}
          onClick={sendQuestion}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}



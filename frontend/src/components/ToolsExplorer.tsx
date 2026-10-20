"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, LayoutGrid, Files, FileInput, FileOutput, ScanText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { tools, type ToolCategory } from "@/lib/tools";
import ToolCard from "./ToolCard";
import "@/app/directory.css";

type FilterKey = "all" | ToolCategory;
const filters = [
  { key: "all" as FilterKey, label: "All tools", icon: LayoutGrid, description: "Every document tool in one place." },
  { key: "organize" as FilterKey, label: "Organize pages", icon: Files, description: "Arrange, edit, and prepare your PDF documents." },
  { key: "to-pdf" as FilterKey, label: "Convert to PDF", icon: FileInput, description: "Turn images, documents, and webpages into PDFs." },
  { key: "from-pdf" as FilterKey, label: "Convert from PDF", icon: FileOutput, description: "Get editable documents, images, or text from a PDF." },
  { key: "ai" as FilterKey, label: "Document content", icon: ScanText, description: "Summarize, translate, and find answers in your documents." },
];
export default function ToolsExplorer() {
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const requested = params.get("category");
  const [selected, setSelected] = useState<FilterKey | null>(null);
  const filter = selected ?? (filters.some(f => f.key === requested) ? requested as FilterKey : "organize");
  const active = filters.find(f => f.key === filter)!;
  function update(category: FilterKey, search = query) {
    setSelected(category); setQuery(search);
    const next = new URLSearchParams();
    next.set("category",category);
    if (search) next.set("q",search);
    window.history.replaceState(null, "", `/tools?${next.toString()}`);
  }
  const results = tools.filter(tool => (filter === "all" || tool.category === filter) && `${tool.title} ${tool.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="directory-workspace" id="tools"><div className="directory-intro"><div><Link href="/" className="directory-back"><ArrowLeft size={13} />Overview</Link><h1>Tools for your next task.</h1><p>Choose a category or find the tool you need.</p></div><label className="directory-search"><Search size={19} /><input aria-label="Search all tools" value={query} onChange={e => update("all",e.target.value)} placeholder="Search all tools…" />{query && <button type="button" aria-label="Clear search" onClick={() => update(filter,"")}><X size={17} /></button>}</label></div><div className="directory-layout"><aside className="directory-sidebar"><h2>CATEGORIES</h2><nav aria-label="Tool categories">{filters.map(({icon:Icon,...f})=><button type="button" key={f.key} aria-pressed={filter === f.key} onClick={() => update(f.key)} className={filter === f.key ? "active" : ""}><Icon size={18} /><span>{f.label}</span><small>{tools.filter(t => f.key === "all" || t.category === f.key).length}</small></button>)}</nav><div className="directory-sidebar-note"><strong>Not sure where to start?</strong><p>Find format requirements and processing details in our guide.</p><Link href="/help">Visit Help →</Link></div></aside><div className="directory-results"><div className="directory-results-heading"><div><h2>{query ? "Search results" : active.label}</h2><p>{query ? `Matching “${query}” across ${active.key === "all" ? "all tools" : active.label.toLowerCase()}.` : active.description}</p></div><span role="status">{results.length} {results.length === 1 ? "tool" : "tools"}</span></div>{results.length ? <div className="directory-card-grid">{results.map(tool => <ToolCard tool={tool} key={tool.href} />)}</div> : <div className="directory-empty"><Search size={27} /><h3>No tools found</h3><p>Try a shorter name, such as “merge” or “image”.</p><button type="button" onClick={() => update("all","")}>Show all tools</button></div>}<p className="directory-processing-note">Each tool explains its supported formats and whether processing happens in your browser or on the document server.</p></div></div></section>;
}





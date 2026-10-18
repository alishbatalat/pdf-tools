"use client";

import { useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { tools, type ToolCategory } from "@/lib/tools";
import ToolCard from "./ToolCard";

type FilterKey = "all" | ToolCategory;
const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All tools" },
  { key: "organize", label: "Organize" },
  { key: "to-pdf", label: "Convert to PDF" },
  { key: "from-pdf", label: "Convert from PDF" },
  { key: "ai", label: "AI tools" },
];

export default function ToolsExplorer() {
  const [query, setQuery] = useState("");
  const params = useSearchParams();
  const [selectedFilter, setFilter] = useState<FilterKey | null>(null);
  const requested = params.get("category");
  const filter: FilterKey = selectedFilter ?? (filters.some(f => f.key === requested) ? requested as FilterKey : "organize");
  const results = useMemo(() => tools.filter(tool =>
    (filter === "all" || tool.category === filter) &&
    `${tool.title} ${tool.description}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [query, filter]);

  return (
    <>
      <section id="tools" className="tool-directory full-directory">
        <div className="directory-heading"><div><p className="eyebrow">FOLDERO / TOOLS</p><h1>All PDF tools</h1><p className="directory-description">Find a tool by name or browse by category.</p></div><label className="tool-search"><Search size={18} /><input aria-label="Search tools" value={query} onChange={e => { setQuery(e.target.value); setFilter("all"); }} placeholder="Find a tool…" />{query && <button aria-label="Clear search" onClick={() => setQuery("")}>×</button>}</label></div>
        <div className="directory-toolbar"><div className="tool-filters" aria-label="Filter tools">{filters.map(f => <button key={f.key} aria-pressed={filter === f.key} className={filter === f.key ? "selected" : ""} onClick={() => setFilter(f.key)}>{f.label}<span>{tools.filter(t => f.key === "all" || t.category === f.key).length}</span></button>)}</div><span className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "tool" : "tools"}</span></div>
        {results.length ? <div className="tool-grid">{results.map(tool => <ToolCard key={tool.href} tool={tool} />)}</div> : <div className="empty-tools"><h3>No matching tools</h3><p>Try a different search or choose another category.</p><button onClick={() => {setQuery(""); setFilter("all");}}>Show all tools</button></div>}
        <p className="directory-note">Browser and server processing are identified on each tool page. Review the supported formats before selecting a file.</p>
      </section>
    </>
  );
}







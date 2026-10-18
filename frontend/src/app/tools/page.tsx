import { Suspense } from "react";
import type { Metadata } from "next";
import ToolsExplorer from "@/components/ToolsExplorer";
export const metadata: Metadata = { title: "All PDF tools — Foldero", description: "Browse tools for organizing PDFs, converting documents, and working with document content." };
export default function ToolsPage() { return <main className="flex-1"><Suspense fallback={<div className="tool-directory">Loading tools…</div>}><ToolsExplorer /></Suspense></main>; }


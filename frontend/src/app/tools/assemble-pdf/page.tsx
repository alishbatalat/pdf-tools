import type { Metadata } from "next";
import { Combine } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import AssemblePdfTool from "@/components/tools/AssemblePdfTool";

export const metadata: Metadata = {
  title: "Assemble PDF — Foldero",
  description: "Arrange several PDFs and images page by page, move pages between documents, and save the result as one PDF. Runs entirely in your browser.",
};

export default function AssemblePdfPage() {
  return (
    <ToolPageShell
      icon={Combine}
      title="Assemble PDF documents"
      description="Arrange several PDFs and images page by page — move pages between documents, rotate, duplicate, delete, and save the result as one file."
      category="organize"
    >
      <AssemblePdfTool />
    </ToolPageShell>
  );
}

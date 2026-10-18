import type { Metadata } from "next";
import { FileType } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import PdfToTextTool from "@/components/tools/PdfToTextTool";

export const metadata: Metadata = {
  title: "PDF to Text — Foldero",
  description: "Extract raw text content from any PDF. Runs entirely in your browser.",
};

export default function PdfToTextPage() {
  return (
    <ToolPageShell
      icon={FileType}
      title="PDF to Text"
      description="Extract raw text content from any PDF."
      category="from-pdf"
    >
      <PdfToTextTool />
    </ToolPageShell>
  );
}

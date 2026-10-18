import type { Metadata } from "next";
import { FileOutput } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import PdfToOfficeTool from "@/components/tools/PdfToOfficeTool";

export const metadata: Metadata = {
  title: "PDF to Word — Foldero",
  description: "Convert a PDF into an editable Word document.",
};

export default function PdfToWordPage() {
  return (
    <ToolPageShell
      icon={FileOutput}
      title="PDF to Word"
      description="Convert a PDF into an editable Word document."
      category="from-pdf"
    >
      <PdfToOfficeTool outputFormat="docx" resultLabel="Converted to Word" />
    </ToolPageShell>
  );
}

import type { Metadata } from "next";
import { FileText } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import OfficeToPdfTool from "@/components/tools/OfficeToPdfTool";

export const metadata: Metadata = {
  title: "Word to PDF — Foldero",
  description: "Convert DOC and DOCX files into PDF.",
};

export default function WordToPdfPage() {
  return (
    <ToolPageShell
      icon={FileText}
      title="Word to PDF"
      description="Convert DOC and DOCX files into PDF."
      category="to-pdf"
    >
      <OfficeToPdfTool
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        title="Drop a Word document here, or click to browse"
        hint="DOC or DOCX files."
      />
    </ToolPageShell>
  );
}

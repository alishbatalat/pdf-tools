import type { Metadata } from "next";
import { FileSpreadsheet } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import PdfToOfficeTool from "@/components/tools/PdfToOfficeTool";

export const metadata: Metadata = {
  title: "PDF to Excel — Foldero",
  description: "Pull tables out of a PDF into a spreadsheet.",
};

export default function PdfToExcelPage() {
  return (
    <ToolPageShell
      icon={FileSpreadsheet}
      title="PDF to Excel"
      description="Pull tables out of a PDF into a spreadsheet."
      category="from-pdf"
    >
      <PdfToOfficeTool outputFormat="xlsx" resultLabel="Converted to Excel" />
    </ToolPageShell>
  );
}

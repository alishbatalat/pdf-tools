import type { Metadata } from "next";
import { FileSpreadsheet } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import OfficeToPdfTool from "@/components/tools/OfficeToPdfTool";

export const metadata: Metadata = {
  title: "Excel to PDF — Foldero",
  description: "Convert spreadsheets into a clean, printable PDF.",
};

export default function ExcelToPdfPage() {
  return (
    <ToolPageShell
      icon={FileSpreadsheet}
      title="Excel to PDF"
      description="Convert spreadsheets into a clean, printable PDF."
      category="to-pdf"
    >
      <OfficeToPdfTool
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        title="Drop a spreadsheet here, or click to browse"
        hint="XLSX files. (Legacy .xls isn't supported — save as .xlsx first.)"
      />
    </ToolPageShell>
  );
}

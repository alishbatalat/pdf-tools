import type { Metadata } from "next";
import { ScanText } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import OcrPdfTool from "@/components/tools/OcrPdfTool";

export const metadata: Metadata = {
  title: "OCR PDF — Foldero",
  description: "Extract text from a scanned PDF. Runs entirely in your browser.",
};

export default function OcrPdfPage() {
  return (
    <ToolPageShell
      icon={ScanText}
      title="OCR PDF"
      description="Extract text from a scanned PDF that has no selectable text layer."
      category="from-pdf"
    >
      <OcrPdfTool />
    </ToolPageShell>
  );
}

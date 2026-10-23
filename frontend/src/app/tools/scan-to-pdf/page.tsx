import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import ScanToPdfTool from "@/components/tools/ScanToPdfTool";

export const metadata: Metadata = {
  title: "Scan to PDF — Foldero",
  description: "Scan paper documents with your camera instead of a scanner, optimize each page, and save everything as one PDF. Runs entirely in your browser.",
};

export default function ScanToPdfPage() {
  return (
    <ToolPageShell
      icon={ScanLine}
      title="Scan to PDF"
      description="Scan paper documents with your smartphone or webcam, add more pages, and save everything as one PDF."
      category="to-pdf"
    >
      <ScanToPdfTool />
    </ToolPageShell>
  );
}

import type { Metadata } from "next";
import { Stamp } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import WatermarkPdfTool from "@/components/tools/WatermarkPdfTool";

export const metadata: Metadata = {
  title: "Add Watermark — Foldero",
  description: "Stamp text across every page of a PDF. Runs entirely in your browser.",
};

export default function WatermarkPdfPage() {
  return (
    <ToolPageShell
      icon={Stamp}
      title="Add Watermark"
      description="Stamp text diagonally across every page of a PDF."
      category="organize"
    >
      <WatermarkPdfTool />
    </ToolPageShell>
  );
}

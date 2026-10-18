import type { Metadata } from "next";
import { Minimize2 } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import CompressPdfTool from "@/components/tools/CompressPdfTool";

export const metadata: Metadata = {
  title: "Compress PDF — Foldero",
  description: "Shrink a PDF's file size. Runs entirely in your browser.",
};

export default function CompressPdfPage() {
  return (
    <ToolPageShell
      icon={Minimize2}
      title="Compress PDF"
      description="Shrink a PDF's file size by re-rendering its pages at a lower quality."
      category="organize"
    >
      <CompressPdfTool />
    </ToolPageShell>
  );
}

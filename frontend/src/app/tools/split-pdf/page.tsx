import type { Metadata } from "next";
import { Scissors } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import SplitPdfTool from "@/components/tools/SplitPdfTool";

export const metadata: Metadata = {
  title: "Split PDF — Foldero",
  description: "Separate pages or save each page as its own file. Runs entirely in your browser.",
};

export default function SplitPdfPage() {
  return (
    <ToolPageShell
      icon={Scissors}
      title="Split PDF"
      description="Separate pages or save each page as its own file."
      category="organize"
    >
      <SplitPdfTool />
    </ToolPageShell>
  );
}

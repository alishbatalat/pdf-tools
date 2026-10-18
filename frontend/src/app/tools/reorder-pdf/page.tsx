import type { Metadata } from "next";
import { ListOrdered } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import ReorderPdfTool from "@/components/tools/ReorderPdfTool";

export const metadata: Metadata = {
  title: "Reorder PDF Pages — Foldero",
  description: "Drag pages into the order they should actually be in. Runs entirely in your browser.",
};

export default function ReorderPdfPage() {
  return (
    <ToolPageShell
      icon={ListOrdered}
      title="Reorder Pages"
      description="Move pages into the order they should actually be in."
      category="organize"
    >
      <ReorderPdfTool />
    </ToolPageShell>
  );
}

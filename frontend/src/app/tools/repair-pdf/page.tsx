import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import RepairPdfTool from "@/components/tools/RepairPdfTool";

export const metadata: Metadata = {
  title: "Repair PDF — Foldero",
  description: "Fix corrupt or broken PDF files and recover as much of their pages and content as possible. Process several files at once, entirely in your browser.",
};

export default function RepairPdfPage() {
  return (
    <ToolPageShell
      icon={Wrench}
      title="Repair PDF"
      description="Fix corrupt or broken PDF files and recover as much of their pages and content as possible, process several files at once."
      category="organize"
    >
      <RepairPdfTool />
    </ToolPageShell>
  );
}

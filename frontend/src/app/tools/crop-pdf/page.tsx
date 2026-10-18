import type { Metadata } from "next";
import { Crop } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import CropPdfTool from "@/components/tools/CropPdfTool";

export const metadata: Metadata = {
  title: "Crop PDF — Foldero",
  description: "Trim margins or isolate a specific area of the page. Runs entirely in your browser.",
};

export default function CropPdfPage() {
  return (
    <ToolPageShell
      icon={Crop}
      title="Crop PDF"
      description="Trim margins off every page."
      category="organize"
    >
      <CropPdfTool />
    </ToolPageShell>
  );
}

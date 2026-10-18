import type { Metadata } from "next";
import { Presentation } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import OfficeToPdfTool from "@/components/tools/OfficeToPdfTool";

export const metadata: Metadata = {
  title: "PowerPoint to PDF — Foldero",
  description: "Convert slideshows into PDF for easy sharing.",
};

export default function PptToPdfPage() {
  return (
    <ToolPageShell
      icon={Presentation}
      title="PowerPoint to PDF"
      description="Convert slideshows into PDF for easy sharing."
      category="to-pdf"
    >
      <OfficeToPdfTool
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        title="Drop a slideshow here, or click to browse"
        hint="PPTX files, text only — shapes/images aren't carried over. (Legacy .ppt isn't supported — save as .pptx first.)"
      />
    </ToolPageShell>
  );
}

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
        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        title="Drop a slideshow here, or click to browse"
        hint="PPT or PPTX files."
      />
    </ToolPageShell>
  );
}

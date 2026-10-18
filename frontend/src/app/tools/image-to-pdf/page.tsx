import type { Metadata } from "next";
import { Image as ImageIcon } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import ImageToPdfTool from "@/components/tools/ImageToPdfTool";

export const metadata: Metadata = {
  title: "Image to PDF — Foldero",
  description: "Turn JPG or PNG images into a PDF. Runs entirely in your browser.",
};

export default function ImageToPdfPage() {
  return (
    <ToolPageShell
      icon={ImageIcon}
      title="Image to PDF"
      description="Turn JPG or PNG images into a PDF."
      category="to-pdf"
    >
      <ImageToPdfTool />
    </ToolPageShell>
  );
}

import type { Metadata } from "next";
import { Tags } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import ChangeMetadataTool from "@/components/tools/ChangeMetadataTool";

export const metadata: Metadata = {
  title: "Edit PDF Info — Foldero",
  description: "Edit the title, author, subject, and keywords stored in a PDF, and see the current values before you save. Runs entirely in your browser.",
};

export default function EditPdfInfoPage() {
  return (
    <ToolPageShell
      icon={Tags}
      title="Edit PDF Info"
      description="Edit the title, author, subject, and keywords stored in a PDF, then save a corrected copy."
      category="organize"
    >
      <ChangeMetadataTool />
    </ToolPageShell>
  );
}

import type { Metadata } from "next";
import { MessageSquareText } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import ChatWithPdfTool from "@/components/tools/ChatWithPdfTool";

export const metadata: Metadata = {
  title: "Chat with PDF — Foldero",
  description: "Ask questions and get answers straight from the document.",
};

export default function ChatWithPdfPage() {
  return (
    <ToolPageShell
      icon={MessageSquareText}
      title="Chat with PDF"
      description="Ask questions and get answers straight from the document."
      category="ai"
    >
      <ChatWithPdfTool />
    </ToolPageShell>
  );
}

import {
  Crop,
  FileMinus,
  FileOutput,
  FileSignature,
  FileSpreadsheet,
  FileStack,
  FileText,
  FileType,
  Globe,
  Hash,
  Image as ImageIcon,
  Languages,
  ListOrdered,
  type LucideIcon,
  MessageSquareText,
  Minimize2,
  PenSquare,
  Presentation,
  RotateCw,
  ScanText,
  Scissors,
  Sparkles,
} from "lucide-react";

export type ToolCategory = "organize" | "to-pdf" | "from-pdf" | "ai";

export interface Tool {
  title: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  href: string;
}

export const categoryMeta: Record<ToolCategory, { label: string }> = {
  organize: {
    label: "Organize PDF",
  },
  "to-pdf": {
    label: "Convert to PDF",
  },
  "from-pdf": {
    label: "Convert from PDF",
  },
  ai: {
    label: "Document content",
  },
};

export const tools: Tool[] = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDFs into one, in the order you want.",
    icon: FileStack,
    category: "organize",
    href: "/tools/merge-pdf",
  },
  {
    title: "Split PDF",
    description: "Separate pages or save each page as its own file.",
    icon: Scissors,
    category: "organize",
    href: "/tools/split-pdf",
  },
  {
    title: "Rotate PDF",
    description: "Fix sideways or upside-down pages in bulk.",
    icon: RotateCw,
    category: "organize",
    href: "/tools/rotate-pdf",
  },
  {
    title: "Reorder Pages",
    description: "Drag pages into the order they should actually be in.",
    icon: ListOrdered,
    category: "organize",
    href: "/tools/reorder-pdf",
  },
  {
    title: "Delete Pages",
    description: "Remove the pages you don't need from a document.",
    icon: FileMinus,
    category: "organize",
    href: "/tools/delete-pages",
  },
  {
    title: "Crop PDF",
    description: "Trim margins or isolate a specific area of the page.",
    icon: Crop,
    category: "organize",
    href: "/tools/crop-pdf",
  },
  {
    title: "Compress PDF",
    description: "Shrink a PDF's file size.",
    icon: Minimize2,
    category: "organize",
    href: "/tools/compress-pdf",
  },
  {
    title: "Add Page Numbers",
    description: "Number every page, bottom-centered.",
    icon: Hash,
    category: "organize",
    href: "/tools/page-numbers",
  },
  {
    title: "Editor PDF",
    description: "Add text, images, and shapes anywhere on a page.",
    icon: PenSquare,
    category: "organize",
    href: "/tools/editor-pdf",
  },
  {
    title: "Sign PDF",
    description: "Draw, upload, or photograph a signature and place it on your document.",
    icon: FileSignature,
    category: "organize",
    href: "/tools/sign-pdf",
  },
  {
    title: "Image to PDF",
    description: "Turn JPG, PNG, or other images into a PDF.",
    icon: ImageIcon,
    category: "to-pdf",
    href: "/tools/image-to-pdf",
  },
  {
    title: "Word to PDF",
    description: "Convert DOC and DOCX files into PDF.",
    icon: FileText,
    category: "to-pdf",
    href: "/tools/word-to-pdf",
  },
  {
    title: "Excel to PDF",
    description: "Convert spreadsheets into a clean, printable PDF.",
    icon: FileSpreadsheet,
    category: "to-pdf",
    href: "/tools/excel-to-pdf",
  },
  {
    title: "PowerPoint to PDF",
    description: "Convert slideshows into PDF for easy sharing.",
    icon: Presentation,
    category: "to-pdf",
    href: "/tools/ppt-to-pdf",
  },
  {
    title: "Webpage to PDF",
    description: "Turn any URL into a saved, shareable PDF.",
    icon: Globe,
    category: "to-pdf",
    href: "/tools/webpage-to-pdf",
  },
  {
    title: "PDF to Image",
    description: "Export pages as JPG or PNG images.",
    icon: ImageIcon,
    category: "from-pdf",
    href: "/tools/pdf-to-image",
  },
  {
    title: "PDF to Word",
    description: "Convert a PDF into an editable Word document.",
    icon: FileOutput,
    category: "from-pdf",
    href: "/tools/pdf-to-word",
  },
  {
    title: "PDF to Excel",
    description: "Pull tables out of a PDF into a spreadsheet.",
    icon: FileSpreadsheet,
    category: "from-pdf",
    href: "/tools/pdf-to-excel",
  },
  {
    title: "PDF to Text",
    description: "Extract selectable text from a PDF.",
    icon: FileType,
    category: "from-pdf",
    href: "/tools/pdf-to-text",
  },
  {
    title: "OCR PDF",
    description: "Extract text from a scanned PDF with no text layer.",
    icon: ScanText,
    category: "from-pdf",
    href: "/tools/ocr-pdf",
  },
  {
    title: "Summarize PDF",
    description: "Get a concise AI summary of a long document.",
    icon: Sparkles,
    category: "ai",
    href: "/tools/summarize-pdf",
  },
  {
    title: "Chat with PDF",
    description: "Ask questions and get answers straight from the document.",
    icon: MessageSquareText,
    category: "ai",
    href: "/tools/chat-with-pdf",
  },
  {
    title: "Translate PDF",
    description: "Translate extracted PDF text into another language.",
    icon: Languages,
    category: "ai",
    href: "/tools/translate-pdf",
  },
];

export const toolsByCategory = (category: ToolCategory) =>
  tools.filter((tool) => tool.category === category);

export const getToolByHref = (href: string) => tools.find((tool) => tool.href === href);


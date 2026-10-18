import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileStack, Scissors, FileText } from "lucide-react";
import TrustStrip from "@/components/TrustStrip";
const shortcuts = [
  { title: "Merge PDF", description: "Combine multiple PDFs into one file.", href: "/tools/merge-pdf", icon: FileStack },
  { title: "Split PDF", description: "Extract pages or separate a document.", href: "/tools/split-pdf", icon: Scissors },
  { title: "PDF to Word", description: "Convert a PDF into an editable document.", href: "/tools/pdf-to-word", icon: FileText },
];
export default function Home() {
  return <main className="flex-1"><section className="home-hero home-intro"><div className="hero-copy"><p className="eyebrow">PDF TOOLS, IN YOUR BROWSER</p><h1>Work with PDFs.<br /><span>Keep it simple.</span></h1><p className="hero-description">Organize pages, convert documents, and prepare files for sharing. Choose a tool to get started.</p><Link href="/tools" className="primary-button">Browse all tools <ArrowRight size={17} /></Link><p className="hero-note">No software to install.</p></div><div className="quick-start"><div className="quick-heading"><span>Common tasks</span><span className="small-label">QUICK ACCESS</span></div>{shortcuts.map(({icon: Icon,...tool}) => <Link key={tool.href} href={tool.href} className="quick-item"><span className="quick-icon"><Icon size={22} /></span><span><strong>{tool.title}</strong><small>{tool.description}</small></span><ArrowUpRight size={18} /></Link>)}<Link href="/tools" className="quick-foot all-tools-link">View all 18 tools <ArrowRight size={14} /></Link></div></section><TrustStrip /></main>;
}

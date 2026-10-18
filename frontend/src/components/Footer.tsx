import Link from "next/link";
import { FileStack, ArrowUpRight } from "lucide-react";
export default function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><div><Link href="/" className="brand"><FileStack size={22} />foldero.</Link><p>Less time on files. More time for your work.</p></div><div className="footer-links"><Link href="/tools/merge-pdf">Merge PDF <ArrowUpRight size={13} /></Link><Link href="/tools/split-pdf">Split PDF <ArrowUpRight size={13} /></Link><Link href="/tools">Explore all tools <ArrowUpRight size={13} /></Link></div></div><div className="footer-bottom"><span>© 2026 Foldero</span><span>A practical place for your PDFs.</span></div></footer>;
}


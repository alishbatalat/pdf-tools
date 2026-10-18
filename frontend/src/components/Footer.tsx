import Link from "next/link";
import { FileStack } from "lucide-react";
export default function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><div><Link href="/" className="brand"><FileStack size={22} />Foldero</Link><p>Tools for everyday document work.</p></div><nav className="footer-links" aria-label="Support navigation"><Link href="/tools">All tools</Link><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></nav></div><div className="footer-bottom"><span>© 2026 Foldero</span><span>Review your files before sharing.</span></div></footer>;
}

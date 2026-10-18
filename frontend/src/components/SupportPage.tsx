import Link from "next/link";
import type { ReactNode } from "react";
export default function SupportPage({title,intro,children}:{title:string;intro:string;children:ReactNode}) {
  return <main className="support-page"><Link className="support-back" href="/">← Back to Foldero</Link><h1>{title}</h1><p className="support-intro">{intro}</p><div className="support-content">{children}</div><nav className="support-navigation" aria-label="Related support pages"><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></nav></main>;
}

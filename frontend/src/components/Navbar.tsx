"use client";
import Link from "next/link";
import { useState } from "react";
import { FileStack, Menu, X, ArrowUpRight } from "lucide-react";
export default function Navbar() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><nav className="site-nav"><Link href="/" className="brand"><span className="brand-mark"><FileStack size={21} /></span>foldero<span className="brand-dot">.</span></Link><div className="desktop-links"><Link href="/tools">All tools</Link><Link href="/tools/merge-pdf">Merge PDF</Link><Link href="/tools/pdf-to-word">PDF to Word</Link></div><Link href="/#about" className="nav-about">How it works <ArrowUpRight size={15} /></Link><button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button></nav>{open && <div className="mobile-links">{[{href:"/tools",label:"All tools"},{href:"/tools/merge-pdf",label:"Merge PDF"},{href:"/#about",label:"How it works"}].map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}</div>}</header>;
}


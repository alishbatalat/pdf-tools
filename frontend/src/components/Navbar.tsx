"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FileStack, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AccountMenu from "./AccountMenu";
const links = [{href:"/",label:"Overview"},{href:"/tools",label:"Tools"}];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <header className="site-header"><nav className="site-nav" aria-label="Main navigation"><Link href="/" className="brand"><span className="brand-mark"><FileStack size={21} /></span>Foldero</Link><div className="desktop-links">{links.map(link => <Link key={link.href} href={link.href} aria-current={(link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)) ? "page" : undefined}>{link.label}</Link>)}</div><div className="nav-actions"><AccountMenu /><ThemeToggle /><button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button></div></nav>{open && <div id="mobile-navigation" className="mobile-links">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}</div>}</header>;
}



import Link from "next/link";
import { ArrowRight, FileStack, Scissors, FileText, Files, ArrowLeftRight, ScanText } from "lucide-react";
const shortcuts = [
  { title: "Merge PDF", description: "Combine files", href: "/tools/merge-pdf", icon: FileStack },
  { title: "Split PDF", description: "Extract pages", href: "/tools/split-pdf", icon: Scissors },
  { title: "PDF to Word", description: "Create an editable file", href: "/tools/pdf-to-word", icon: FileText },
];
const categories = [
  { number:"01", title:"Organize pages", description:"Merge, split, rotate, and reorder your documents.", href:"/tools?category=organize", icon:Files },
  { number:"02", title:"Convert files", description:"Move between PDF, Word, images, and more.", href:"/tools?category=to-pdf", icon:ArrowLeftRight },
  { number:"03", title:"Work with content", description:"Summarize, translate, and ask questions about documents.", href:"/tools?category=ai", icon:ScanText },
];
export default function Home() {
  return <main className="flex-1"><section className="workspace-intro"><div className="workspace-heading"><p className="section-kicker">DOCUMENT WORKSPACE</p><h1>Your PDF tasks,<br />in one place.</h1><p>Prepare, organize, and convert documents with tools built around the task at hand.</p><Link href="/tools" className="primary-button">Explore the tools <ArrowRight size={17} /></Link><span className="intro-note">Works in your browser. No installation required.</span></div><aside className="task-panel"><div className="task-panel-heading"><h2>Quick start</h2><span>3 common tasks</span></div>{shortcuts.map(({icon:Icon,...tool}) => <Link key={tool.href} href={tool.href} className="task-row"><span className="task-icon"><Icon size={21} /></span><span><strong>{tool.title}</strong><small>{tool.description}</small></span><ArrowRight size={17} /></Link>)}<Link className="task-panel-footer" href="/tools">View all tools <ArrowRight size={15} /></Link></aside></section><section className="workflow-section"><div className="section-heading"><h2>Choose what you need to do</h2><Link href="/tools">All 18 tools <ArrowRight size={15} /></Link></div><div className="workflow-grid">{categories.map(({icon:Icon,...item}) => <Link href={item.href} key={item.number} className="workflow-item"><div><Icon size={22} /><span>{item.number}</span></div><h3>{item.title}</h3><p>{item.description}</p><ArrowRight size={17} /></Link>)}</div></section><section id="about" className="usage-section"><h2>From upload to download</h2><ol><li><span>1</span><div><strong>Select a tool</strong><p>Choose the operation you need.</p></div></li><li><span>2</span><div><strong>Add your files</strong><p>Upload and adjust the settings.</p></div></li><li><span>3</span><div><strong>Download the result</strong><p>Save the finished file to your device.</p></div></li></ol></section></main>;
}


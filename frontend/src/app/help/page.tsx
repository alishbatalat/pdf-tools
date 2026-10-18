import Link from "next/link";
import SupportPage from "@/components/SupportPage";
export const metadata = {title:"Help — Foldero"};
const questions = [
  ["How do I save my result?", "Select your file and continue, adjust any available settings, then run the tool. Results stay on the page until you click Download file. Generated PDFs include a preview. Save your result before leaving the page."],
  ["Which tools work in my browser?", "Page organization, image-to-PDF, PDF-to-image, and PDF-to-text run in your browser. Office conversions, webpage conversion, summaries, translation, and document questions require the document server."],
  ["Why does a conversion fail?", "Check the supported format shown above the uploader. Server file conversions accept up to 25 MB. Legacy XLS and PPT formats are not supported; save as XLSX or PPTX first. A damaged, encrypted, or scanned document may not work."],
  ["Why does my converted document look different?", "Office conversions reconstruct content and basic formatting. Complex layouts, embedded objects, and fonts may change. PowerPoint conversion is text-only. Webpage conversion produces a reader-style document."],
  ["Why is a document content tool taking longer?", "The document server loads local language models. A first request can take longer while a model downloads or loads. These tools require selectable text; OCR is not available."],
  ["What should I do if the server cannot be reached?", "Try again when the document server is available. Browser-based tools can still work. If you run this installation, check that the backend is running and allows your website address."],
  ["How do I switch appearance?", "Use the sun or moon button in the header. Your preference is saved in this browser."],
];
export default function HelpPage(){return <SupportPage title="Help" intro="File requirements, processing details, and answers to common questions."><section><h2>Getting started</h2><ol><li>Choose a tool and select your document.</li><li>Review the file and any available settings.</li><li>Process, review the result, and download your file.</li></ol></section><section><h2>Common questions</h2><div className="faq-list">{questions.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section><p>Need to report a problem? Visit <Link href="/contact">Contact</Link>. Learn more about <Link href="/privacy">document processing and privacy</Link>.</p></SupportPage>}

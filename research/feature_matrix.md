# PDF Tool Site — Feature Matrix

Compiled from public homepages of iLovePDF, Smallpdf, PDF2Go, and Sejda (Oct 2026).
Use this as a feature backlog for your own site — it's a list of *functions*, not their code/design/content.

Legend: ✅ = offered, — = not seen on that site's homepage.

| Feature | iLovePDF | Smallpdf | PDF2Go | Sejda |
|---|---|---|---|---|
| **Convert TO PDF** |
| Word to PDF | ✅ | ✅ | ✅ | ✅ |
| Excel to PDF | ✅ | ✅ | ✅ | — |
| PowerPoint to PDF | ✅ | ✅ | ✅ | — |
| JPG/Image to PDF | ✅ | ✅ (+PNG/BMP/GIF/TIFF) | ✅ (+PNG) | ✅ |
| HTML/Webpage to PDF | ✅ | ✅ | ✅ | ✅ |
| TXT/RTF to PDF | — | ✅ | — | — |
| EPUB to PDF | — | ✅ | ✅ | — |
| ODT/ODS/ODP (OpenOffice) to PDF | — | ✅ | — | — |
| CSV / ZIP to PDF | — | ✅ | — | — |
| DjVu to PDF | — | — | ✅ | — |
| Speech to Text | — | — | ✅ | — |
| **Convert FROM PDF** |
| PDF to Word | ✅ | ✅ | ✅ | ✅ |
| PDF to Excel | ✅ | ✅ | ✅ | ✅ |
| PDF to PowerPoint | ✅ | ✅ | ✅ | ✅ |
| PDF to JPG/PNG | ✅ | ✅ | ✅ | ✅ (+TIFF) |
| PDF to Text | — | — | ✅ | ✅ |
| PDF to EPUB | — | — | ✅ | — |
| PDF to PDF/A | ✅ | ✅ | ✅ | — |
| PDF to Speech (audio) | — | — | ✅ | — |
| **Organize / Pages** |
| Merge PDF | ✅ | ✅ | ✅ | ✅ (+alternate/mix) |
| Split PDF | ✅ | ✅ | ✅ | ✅ (by pages/bookmarks/size/text) |
| Extract pages | ✅ | ✅ | — | ✅ |
| Remove/Delete pages | ✅ | ✅ | — | ✅ |
| Reorder/Organize pages | ✅ | ✅ | ✅ | ✅ |
| Rotate PDF | ✅ | ✅ | ✅ | ✅ |
| Crop PDF | ✅ | ✅ | ✅ | ✅ |
| N-up / Poster / Booklet print | — | — | ✅ | ✅ |
| Resize / change page size | — | — | ✅ | ✅ |
| **Optimize / Fix** |
| Compress PDF | ✅ | ✅ | ✅ | ✅ |
| Repair PDF | ✅ | — | ✅ | ✅ |
| OCR (searchable scans) | ✅ | ✅ | ✅ | ✅ |
| Deskew scans | — | — | — | ✅ |
| Scan to PDF | ✅ | ✅ | — | — |
| **Edit** |
| Edit text/images/annotations | ✅ | ✅ | ✅ | ✅ |
| Add page numbers | ✅ | ✅ | — | ✅ |
| Add watermark | ✅ | ✅ | ✅ | ✅ |
| Fill & create forms | ✅ | ✅ | — | ✅ |
| Edit metadata | — | — | — | ✅ |
| Grayscale conversion | — | — | — | ✅ |
| Flip pages | — | — | — | ✅ |
| Header & footer | — | — | — | ✅ |
| Bates numbering | — | — | — | ✅ |
| Create bookmarks | — | — | — | ✅ |
| Remove annotations (batch) | — | — | — | ✅ |
| **Security** |
| Protect (add password) | ✅ | ✅ | ✅ | ✅ |
| Unlock (remove password) | ✅ | ✅ | ✅ | ✅ |
| Sign PDF / e-signature | ✅ | ✅ (+Sign.com) | ✅ | ✅ |
| Redact PDF | ✅ | ✅ | ✅ | — |
| Flatten forms | — | ✅ | — | ✅ |
| Compare two PDFs | ✅ | — | ✅ | — |
| **AI features** |
| Chat with / ask PDF | — | ✅ | ✅ | — |
| Summarize PDF | ✅ | ✅ | ✅ | — |
| Translate PDF | ✅ | ✅ | ✅ | — |
| PDF to Markdown | ✅ | — | — | — |
| Extract key facts | — | — | ✅ | — |
| Spellcheck | — | — | ✅ | — |
| **Platform features (not file tools)** |
| Chained/custom workflows | ✅ | — | — | ✅ |
| Desktop/mobile apps | most of these sites also sell a paid desktop/mobile app + API |

## Suggested MVP for a new site (most-requested, lowest build effort first)

1. Word/Excel/PowerPoint → PDF and PDF → Word/Excel/PowerPoint (needs a conversion engine — see note below)
2. Merge / Split / Rotate / Reorder / Extract / Delete pages (pure PDF manipulation, no OCR needed)
3. Compress PDF (re-encode images, strip unused objects)
4. JPG/PNG ↔ PDF
5. Protect / Unlock (password)
6. Watermark / Page numbers
7. OCR (searchable PDF) — bigger lift, usually via Tesseract or a cloud OCR API
8. Sign PDF (draw/type/upload signature, stamp onto page)

**Build note:** Office↔PDF conversion is the hardest part — competitors run LibreOffice headless, or a paid API (Aspose, CloudConvert, Adobe PDF Services) server-side. Plain PDF page operations (merge/split/rotate/compress/watermark/password) can be done with libraries like `pypdf`/`pikepdf` (Python) or `pdf-lib`/`qpdf` (Node) with no external conversion engine.

const HEADING_SIZES = { h1: 22, h2: 18, h3: 15, h4: 13, h5: 12, h6: 11 };

function fontFor(bold, italic) {
  if (bold && italic) return "Helvetica-BoldOblique";
  if (bold) return "Helvetica-Bold";
  if (italic) return "Helvetica-Oblique";
  return "Helvetica";
}

function collectRuns($, node, style, runs) {
  $(node)
    .contents()
    .each((_, child) => {
      if (child.type === "text") {
        const t = child.data.replace(/\s+/g, " ");
        if (t) runs.push({ text: t, ...style });
      } else if (child.type === "tag") {
        const tag = child.tagName || child.name;
        if (tag === "br") {
          runs.push({ text: " ", ...style });
          return;
        }
        const next = { ...style };
        if (tag === "strong" || tag === "b") next.bold = true;
        if (tag === "em" || tag === "i") next.italic = true;
        collectRuns($, child, next, runs);
      }
    });
  return runs;
}

function renderRuns(doc, runs, baseSize = 11) {
  const nonEmpty = runs.filter((r) => r.text.trim());
  if (!nonEmpty.length) return;
  nonEmpty.forEach((run, i) => {
    doc
      .font(fontFor(run.bold, run.italic))
      .fontSize(baseSize)
      .text(run.text, { continued: i < nonEmpty.length - 1 });
  });
}

async function tryEmbedImage(doc, src, baseUrl) {
  try {
    const url = baseUrl ? new URL(src, baseUrl).toString() : src;
    if (!/^https?:\/\//i.test(url)) return;
    const res = await fetch(url);
    if (!res.ok) return;
    const contentType = res.headers.get("content-type") ?? "";
    if (!/image\/(png|jpe?g)/i.test(contentType)) return;
    const bytes = Buffer.from(await res.arrayBuffer());
    const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    if (doc.y + 60 > doc.page.height - doc.page.margins.bottom) doc.addPage();
    doc.image(bytes, { fit: [maxWidth, 320] });
    doc.moveDown(0.5);
  } catch {
    // Unembeddable image (SVG, blocked, broken link, etc.) — skip it, keep going.
  }
}

/**
 * Best-effort renderer: walks a cheerio DOM subtree and draws headings,
 * paragraphs, lists and images into an open PDFKit document. This is not a
 * layout engine — it reproduces reading order and basic emphasis, not exact
 * visual fidelity.
 */
export async function renderNodeToPdf(doc, $, root, { baseUrl } = {}) {
  const children = $(root).children().toArray();
  for (const el of children) {
    const tag = el.tagName || el.name;

    if (/^h[1-6]$/.test(tag)) {
      doc.moveDown(0.4);
      renderRuns(doc, collectRuns($, el, { bold: true }, []), HEADING_SIZES[tag]);
      doc.moveDown(0.3);
    } else if (tag === "p") {
      renderRuns(doc, collectRuns($, el, {}, []), 11);
      doc.moveDown(0.5);
    } else if (tag === "ul" || tag === "ol") {
      let n = 1;
      for (const li of $(el).children("li").toArray()) {
        const prefix = tag === "ol" ? `${n++}. ` : "• ";
        const runs = [{ text: prefix }, ...collectRuns($, li, {}, [])];
        doc.text("", { indent: 0 });
        renderRuns(doc, runs, 11);
        doc.moveDown(0.2);
      }
      doc.moveDown(0.3);
    } else if (tag === "table") {
      for (const row of $(el).find("tr").toArray()) {
        const cells = $(row)
          .find("td,th")
          .toArray()
          .map((c) => $(c).text().trim());
        if (cells.length) {
          doc.font("Helvetica").fontSize(10).text(cells.join("   |   "));
        }
      }
      doc.moveDown(0.4);
    } else if (tag === "img") {
      const src = $(el).attr("src");
      if (src) await tryEmbedImage(doc, src, baseUrl);
    } else if (tag === "br") {
      doc.moveDown(0.3);
    } else {
      // Container element (div/section/article/body/...) — recurse.
      await renderNodeToPdf(doc, $, el, { baseUrl });
    }
  }
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** HTML string'inden H2/H3 başlıklarını çıkarır, id ekler ve TOC listesi döner */
export function extractHeadingsAndAddIds(html: string): {
  processedHtml: string;
  headings: TocItem[];
} {
  if (typeof window === "undefined" || !html) {
    return { processedHtml: html, headings: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headings: TocItem[] = [];
  const usedIds = new Set<string>();

  doc.querySelectorAll("h2, h3").forEach((el) => {
    const text = (el.textContent || "").trim();
    if (!text) return;

    // Türkçe karakter dönüşümü + slugify
    const base = text
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Çakışmayı önle
    let uniqueId = base;
    let counter = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${base}-${counter++}`;
    }
    usedIds.add(uniqueId);

    el.setAttribute("id", uniqueId);
    headings.push({ id: uniqueId, text, level: el.tagName === "H2" ? 2 : 3 });
  });

  return { processedHtml: doc.body.innerHTML, headings };
}

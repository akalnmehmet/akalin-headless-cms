import { useEffect } from "react";

/** head'deki meta tag'i bulur ya da yoksa oluşturur; önceki content'i döndürür. */
function syncMeta(
  attrName: "name" | "property",
  attrValue: string,
  content: string,
): string {
  const selector = `meta[${attrName}="${attrValue}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  const prev = el.getAttribute("content") ?? "";
  el.setAttribute("content", content);
  return prev;
}

/** <link rel="canonical"> tag'ini senkronize eder; önceki href'i döndürür. */
function syncCanonical(href: string): string {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  const prev = el.getAttribute("href") ?? "";
  el.setAttribute("href", href);
  return prev;
}

export interface DocumentMetaOptions {
  /** Sayfa başlığı — document.title + og:title + twitter:title */
  title?: string;
  /** Meta description + og:description + twitter:description */
  description?: string;
  /** og:image + twitter:image — tam URL olmalı */
  image?: string;
  /** og:type — varsayılan "website" */
  type?: "website" | "article";
}

/**
 * Sayfa başlığını, meta description'ı ve OG / Twitter Card tag'lerini
 * dinamik olarak günceller. Bileşen unmount olduğunda varsayılan değerlere döner.
 *
 * Geriye dönük uyumluluk: eski çağrılar (title, description) çalışmaya devam eder.
 */
export function useDocumentMeta(
  titleOrOptions?: string | DocumentMetaOptions,
  legacyDescription?: string,
) {
  /* Hem eski (string, string) hem yeni ({...}) çağrı biçimini destekle */
  const opts: DocumentMetaOptions =
    typeof titleOrOptions === "object"
      ? titleOrOptions
      : { title: titleOrOptions, description: legacyDescription };

  const { title, description, image = "", type = "website" } = opts;
  const url = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    /* ── Önceki değerleri sakla (cleanup için) ── */
    const prevTitle = document.title;

    const prev = {
      desc:       document.querySelector<HTMLMetaElement>('meta[name="description"]')?.getAttribute("content") ?? "",
      ogType:     document.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.getAttribute("content") ?? "",
      ogTitle:    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.getAttribute("content") ?? "",
      ogDesc:     document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.getAttribute("content") ?? "",
      ogUrl:      document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.getAttribute("content") ?? "",
      ogImage:    document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.getAttribute("content") ?? "",
      twTitle:    document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.getAttribute("content") ?? "",
      twDesc:     document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.getAttribute("content") ?? "",
      twImage:    document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')?.getAttribute("content") ?? "",
      canonical:  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? "",
    };

    /* ── Güncel değerleri yaz ── */
    if (title) {
      document.title = title;
      syncMeta("property", "og:title",    title);
      syncMeta("name",     "twitter:title", title);
    }
    if (description) {
      syncMeta("name",     "description",         description);
      syncMeta("property", "og:description",      description);
      syncMeta("name",     "twitter:description", description);
    }
    syncMeta("property", "og:type",  type);
    syncMeta("property", "og:url",   url);
    syncMeta("property", "og:image", image);
    syncMeta("name",     "twitter:image", image);
    syncCanonical(url);

    /* ── Cleanup: önceki değerlere dön ── */
    return () => {
      document.title = prevTitle;
      syncMeta("name",     "description",         prev.desc);
      syncMeta("property", "og:type",             prev.ogType);
      syncMeta("property", "og:title",            prev.ogTitle);
      syncMeta("property", "og:description",      prev.ogDesc);
      syncMeta("property", "og:url",              prev.ogUrl);
      syncMeta("property", "og:image",            prev.ogImage);
      syncMeta("name",     "twitter:title",       prev.twTitle);
      syncMeta("name",     "twitter:description", prev.twDesc);
      syncMeta("name",     "twitter:image",       prev.twImage);
      syncCanonical(prev.canonical);
    };
  }, [title, description, image, type, url]);
}

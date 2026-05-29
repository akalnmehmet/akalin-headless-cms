import { useEffect } from "react";

/** Sosyal medya paylaşımlarında og:image boş olduğunda kullanılacak varsayılan görsel */
const DEFAULT_OG_IMAGE = "https://akalin-cms.vercel.app/og-image.png";

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
  /** og:locale — örn. "tr_TR" veya "en_US" */
  locale?: string;
  /** article:published_time — ISO 8601, sadece type="article" */
  articlePublishedTime?: string;
  /** article:modified_time — ISO 8601, sadece type="article" */
  articleModifiedTime?: string;
  /** article:author — yazarın tam adı */
  articleAuthor?: string;
  /** article:tag — etiket adları listesi */
  articleTags?: string[];
  /** article:section — kategori adı */
  articleSection?: string;
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

  const {
    title, description, image, type = "website", locale,
    articlePublishedTime, articleModifiedTime, articleAuthor,
    articleTags, articleSection,
  } = opts;

  // image verilmemişse ya da boşsa varsayılan OG görselini kullan
  const resolvedImage = image || DEFAULT_OG_IMAGE;
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
      ogLocale:   document.querySelector<HTMLMetaElement>('meta[property="og:locale"]')?.getAttribute("content") ?? "",
      twTitle:    document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.getAttribute("content") ?? "",
      twDesc:     document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.getAttribute("content") ?? "",
      twImage:    document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')?.getAttribute("content") ?? "",
      canonical:  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? "",
    };

    /* ── Güncel değerleri yaz ── */
    if (title) {
      document.title = title;
      syncMeta("property", "og:title",      title);
      syncMeta("name",     "twitter:title", title);
    }
    if (description) {
      syncMeta("name",     "description",         description);
      syncMeta("property", "og:description",      description);
      syncMeta("name",     "twitter:description", description);
    }
    syncMeta("property", "og:type",  type);
    syncMeta("property", "og:url",   url);
    syncMeta("property", "og:image", resolvedImage);
    syncMeta("name",     "twitter:image", resolvedImage);
    if (locale) syncMeta("property", "og:locale", locale);
    syncCanonical(url);

    /* ── article:* tag'leri (type="article" olduğunda) ── */
    if (type === "article") {
      if (articlePublishedTime) syncMeta("property", "article:published_time", articlePublishedTime);
      if (articleModifiedTime)  syncMeta("property", "article:modified_time",  articleModifiedTime);
      if (articleAuthor)        syncMeta("property", "article:author",          articleAuthor);
      if (articleSection)       syncMeta("property", "article:section",         articleSection);
      // Her etiket için ayrı meta ekle
      if (articleTags?.length) {
        // Önce eskilerini temizle
        document.querySelectorAll('meta[property="article:tag"]').forEach((el) => el.remove());
        articleTags.forEach((tag) => {
          const el = document.createElement("meta");
          el.setAttribute("property", "article:tag");
          el.setAttribute("content", tag);
          document.head.appendChild(el);
        });
      }
    }

    /* ── Cleanup: önceki değerlere dön ── */
    return () => {
      document.title = prevTitle;
      syncMeta("name",     "description",         prev.desc);
      syncMeta("property", "og:type",             prev.ogType);
      syncMeta("property", "og:title",            prev.ogTitle);
      syncMeta("property", "og:description",      prev.ogDesc);
      syncMeta("property", "og:url",              prev.ogUrl);
      syncMeta("property", "og:image",            prev.ogImage);
      syncMeta("property", "og:locale",           prev.ogLocale);
      syncMeta("name",     "twitter:title",       prev.twTitle);
      syncMeta("name",     "twitter:description", prev.twDesc);
      syncMeta("name",     "twitter:image",       prev.twImage);
      syncCanonical(prev.canonical);
      // article: tag'lerini temizle
      document.querySelectorAll('meta[property^="article:"]').forEach((el) => el.remove());
    };
  // articleTags dizisi her render'da yeni referans üretebilir; stringify ile stabil dep.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title, description, image, type, url, locale,
    articlePublishedTime, articleModifiedTime, articleAuthor,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(articleTags), articleSection,
  ]);
}

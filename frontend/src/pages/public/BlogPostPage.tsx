import DOMPurify from "dompurify";
import hljs from "highlight.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { getPostBySlug, getPostBySlugPreview, getRelatedPosts, incrementViewCount } from "../../api/posts";
import TableOfContents from "../../components/TableOfContents";
import { extractHeadingsAndAddIds } from "../../utils/tocUtils";
import type { TocItem } from "../../utils/tocUtils";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { clImg } from "../../utils/cloudinary";
import type { BlogPostDetail, BlogPostList } from "../../types";

const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "pre", "code", "img", "a", "ul", "ol", "li",
  "blockquote", "strong", "em", "b", "i",
  "table", "thead", "tbody", "tr", "td", "th",
  "div", "span", "section", "br", "hr",
];
const ALLOWED_ATTR = [
  "href", "src", "alt", "class", "id", "target", "rel",
  "width", "height", "loading",
];

function tagStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: `${color}18`,
    color,
    borderColor: `${color}33`,
  };
}

/** Okuma ilerlemesi: sayfanın yüzdesi (0-100) */
function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      if (total <= 0) { setProgress(0); return; }
      setProgress(Math.min(100, (scrollTop / total) * 100));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return progress;
}

export default function BlogPostPage() {
  const { t, i18n } = useTranslation();
  const { slug, lang = "tr" } = useParams<{ slug: string; lang: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const [post, setPost]       = useState<BlogPostDetail | null>(null);
  const [related, setRelated] = useState<BlogPostList[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [processedHtml, setProcessedHtml] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const articleNodeRef = useRef<HTMLElement | null>(null);
  const progress = useReadingProgress();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title ?? "", url }); } catch { /* iptal */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  useDocumentMeta({
    title:               post ? `${post.title} — ${t("blog.title")}` : undefined,
    description:         post?.meta_description || post?.summary || undefined,
    image:               clImg(post?.featured_image?.file_url, "og") || undefined,
    type:                "article",
    locale:              i18n.language === "en" ? "en_US" : "tr_TR",
    articlePublishedTime: post?.created_at,
    articleModifiedTime:  post?.updated_at,
    articleAuthor:        "Mehmet Akalın",
    articleSection:       post?.categories[0]?.name,
    articleTags:          post?.tags.map((tag) => tag.name),
  });

  useEffect(() => {
    if (!slug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setHeadings([]);
    setProcessedHtml("");
    const fetcher = isPreview ? getPostBySlugPreview : getPostBySlug;
    fetcher(slug)
      .then((data) => {
        setPost(data);
        incrementViewCount(slug).catch(() => {});
        getRelatedPosts(slug).then(setRelated).catch(() => setRelated([]));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, isPreview]);

  // İçerik HTML'ini işle: sanitize → id ekle → headings çıkar
  useEffect(() => {
    if (!post?.content_html) return;

    const clean = DOMPurify.sanitize(post.content_html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });

    const { processedHtml: withIds, headings: toc } = extractHeadingsAndAddIds(clean);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProcessedHtml(withIds);
     
    setHeadings(toc);
  }, [post]);

  // Ref callback: innerHTML + hljs + header bar (dil etiketi + kopyala) + anchor linkler.
  const articleRef = useCallback(
    (node: HTMLElement | null) => {
      articleNodeRef.current = node;
      if (!node || !processedHtml) return;

      node.innerHTML = processedHtml;

      // ── Kod bloğu: header bar (dil etiketi + kopyala butonu) ──
      node.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);

        const pre = block.parentElement;
        if (!pre || pre.querySelector(".code-header-bar")) return;

        // Dil sınıfından etiketi çıkar (örn. "language-python" → "python")
        const langClass = Array.from(block.classList).find((c) => c.startsWith("language-"));
        const lang = langClass?.replace("language-", "") ?? "code";

        const bar = document.createElement("div");
        bar.className = "code-header-bar";
        bar.style.cssText = [
          "display:flex", "align-items:center", "justify-content:space-between",
          "padding:5px 12px",
          "background:rgba(0,0,0,0.28)",
          "border-bottom:1px solid rgba(255,255,255,0.06)",
        ].join(";");

        const langEl = document.createElement("span");
        langEl.textContent = lang;
        langEl.style.cssText = [
          "font-size:11px", "font-family:JetBrains Mono,monospace",
          "color:#4c5a72", "text-transform:uppercase", "letter-spacing:0.08em",
        ].join(";");
        bar.appendChild(langEl);

        const btn = document.createElement("button");
        btn.className = "copy-code-btn";
        btn.setAttribute("aria-label", t("blog.copy"));
        btn.style.cssText = [
          "display:flex", "align-items:center", "gap:3px",
          "padding:2px 6px", "border-radius:4px", "border:none",
          "background:transparent", "color:#4c5a72",
          "font-size:11px", "font-family:JetBrains Mono,monospace",
          "cursor:pointer", "transition:color 0.15s,background 0.15s", "line-height:1",
        ].join(";");
        btn.innerHTML =
          `<span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle">content_copy</span><span>${t("blog.copy")}</span>`;

        btn.addEventListener("mouseenter", () => {
          btn.style.background = "rgba(255,255,255,0.08)";
          btn.style.color = "#94a3b8";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background = "transparent";
          btn.style.color = "#4c5a72";
        });
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(block.textContent ?? "").then(() => {
            btn.innerHTML =
              `<span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle;color:#10b981">check</span><span style="color:#10b981">${t("blog.copied")}</span>`;
            setTimeout(() => {
              btn.innerHTML =
                `<span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle">content_copy</span><span>${t("blog.copy")}</span>`;
            }, 2000);
          });
        });

        bar.appendChild(btn);
        pre.insertBefore(bar, pre.firstChild);
      });

      // ── Başlık anchor linkleri ──
      node.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((heading) => {
        if (heading.querySelector(".heading-anchor")) return;
        const anchor = document.createElement("a");
        anchor.href = `#${heading.id}`;
        anchor.className = "heading-anchor";
        anchor.setAttribute("aria-label", "Link");
        anchor.innerHTML =
          `<span class="material-symbols-outlined" style="font-size:18px">link</span>`;
        anchor.addEventListener("click", (e) => {
          e.preventDefault();
          const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
          window.history.pushState(null, "", `#${heading.id}`);
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
          navigator.clipboard.writeText(url).catch(() => {});
        });
        heading.appendChild(anchor);
      });
    },
    [processedHtml, t],
  );

  if (loading) {
    return (
      <>
        {/* Progress bar iskeleti */}
        <div className="fixed top-16 left-0 right-0 z-40 h-[2px] bg-outline-variant/30" />
        <div className="pt-[100px] pb-20 px-6 max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-surface-variant rounded w-3/4" />
            <div className="h-4 bg-surface-variant rounded w-1/3" />
            <div className="h-64 bg-surface-variant rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (notFound || !post) {
    return (
      <div className="pt-[100px] pb-20 px-6 max-w-3xl mx-auto text-center">
        <p className="text-on-surface-variant text-[16px]">{t("blog.postNotFound")}</p>
        <Link to={`/${lang}/blog`} className="text-primary text-[14px] hover:underline mt-4 inline-block">
          ← {t("blog.backToBlog")}
        </Link>
      </div>
    );
  }

  /* ── JSON-LD Structured Data ── */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.meta_title || post.title,
    "description": post.meta_description || post.summary,
    "image": clImg(post.featured_image?.file_url, "og") || undefined,
    "url": typeof window !== "undefined" ? window.location.href : "",
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "inLanguage": i18n.language === "en" ? "en-US" : "tr-TR",
    "author": {
      "@type": "Person",
      "name": "Mehmet Akalın",
      "url": typeof window !== "undefined" ? window.location.origin : "",
    },
    "publisher": {
      "@type": "Person",
      "name": "Mehmet Akalın",
      "url": typeof window !== "undefined" ? window.location.origin : "",
    },
    ...(post.categories.length > 0 && {
      "articleSection": post.categories.map((c) => c.name).join(", "),
    }),
    ...(post.tags.length > 0 && {
      "keywords": post.tags.map((t) => t.name).join(", "),
    }),
  };

  return (
    <>
      {/* ── JSON-LD Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Başa dön butonu ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`print:hidden fixed bottom-8 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-outline-variant shadow-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all duration-200 ${
          progress > 20 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
      </button>

      {/* ── Okuma ilerleme çubuğu ── */}
      <div
        className="print:hidden fixed top-16 left-0 z-40 h-[2px] bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />

      <div className="pt-[100px] pb-20 px-4 sm:px-6 max-w-[1200px] mx-auto">

        {/* İki kolonlu layout: makale + TOC sidebar */}
        <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12 xl:gap-16">

          {/* ── Sol: makale ── */}
          <div className="min-w-0">

            {/* Önizleme modu banner */}
            {isPreview && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/08 text-[#f59e0b]">
                <span className="material-symbols-outlined text-[18px]">preview</span>
                <span className="text-[13px] font-medium" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {t("blog.previewMode")}
                </span>
                <a
                  href="/admin"
                  className="ml-auto text-[12px] underline hover:opacity-80"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {t("blog.backToAdmin")}
                </a>
              </div>
            )}

            {/* Başlık bölümü */}
            <header className="mb-12">
              <h1 className="text-[42px] sm:text-[48px] leading-[1.1] font-bold tracking-[-0.02em] text-on-surface mb-6">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <span
                  className="text-[12px] leading-none tracking-[0.02em] font-medium text-on-surface-variant"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {t("blog.readingTime", { min: post.reading_time })}
                  {" · "}
                  {new Date(post.created_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                  {" · "}
                  {t("blog.views", { count: post.view_count })}
                </span>

                {/* Paylaş butonu */}
                <button
                  onClick={handleShare}
                  className="print:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors duration-150 shrink-0"
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    {shareCopied ? "check" : "share"}
                  </span>
                  {shareCopied ? t("blog.shareSuccess") : t("blog.share")}
                </button>
              </div>

              {/* Etiketler */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-[12px] leading-none tracking-[0.02em] font-medium px-2 py-1 rounded border"
                      style={{
                        ...tagStyle(tag.color),
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Kapak görseli */}
              {post.featured_image && (
                <div className="w-full h-[320px] rounded-xl overflow-hidden border border-outline-variant">
                  <img
                    src={clImg(post.featured_image.file_url, "hero")}
                    alt={post.featured_image.alt_text || post.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </header>

            {/* Mobil TOC — sadece lg altında görünür */}
            <div className="lg:hidden">
              <TableOfContents items={headings} variant="mobile" />
            </div>

            {/* Makale gövdesi */}
            <article
              ref={articleRef}
              className="prose max-w-none text-on-surface"
            />

            {/* İlgili yazılar */}
            {related.length > 0 && (
              <section className="mt-20 pt-12 border-t border-outline-variant">
                <h3 className="text-[20px] font-semibold leading-[1.4] text-on-surface mb-6">
                  {t("blog.relatedPosts")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/${lang}/blog/${rel.slug}`}
                      className="block bg-surface border border-outline-variant rounded-lg p-3 hover:bg-surface-container-low transition-colors duration-150 group"
                    >
                      <div className="h-32 bg-surface-variant rounded mb-3 overflow-hidden">
                        {rel.featured_image ? (
                          <img
                            src={clImg(rel.featured_image.file_url, "thumbnail")}
                            alt={rel.featured_image.alt_text || rel.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-150"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-variant flex items-center justify-center">
                            <span className="text-2xl text-outline">✦</span>
                          </div>
                        )}
                      </div>
                      <h4 className="text-[16px] font-semibold text-on-surface mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-150">
                        {rel.title}
                      </h4>
                      <span
                        className="text-[12px] text-on-surface-variant"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {new Date(rel.created_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        {" · "}
                        {t("blog.readingTime", { min: rel.reading_time })}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Geri dön */}
            <div className="mt-20 pt-12 border-t border-outline-variant flex justify-center">
              <Link
                to={`/${lang}/blog`}
                className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity text-[14px] font-medium group"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform duration-150">
                  arrow_back
                </span>
                {t("blog.backToBlog")}
              </Link>
            </div>
          </div>

          {/* ── Sağ: TOC sidebar — sadece lg+ ── */}
          <div className="hidden lg:block print:hidden">
            <TableOfContents items={headings} variant="desktop" />
          </div>
        </div>
      </div>
    </>
  );
}

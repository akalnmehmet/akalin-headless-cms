import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getPostBySlug, getRelatedPosts, incrementViewCount } from "../../api/posts";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { BlogPostDetail, BlogPostList } from "../../types";

const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "pre", "code", "img", "a", "ul", "ol", "li",
  "blockquote", "strong", "em", "b", "i",
  "table", "thead", "tbody", "tr", "td", "th",
  "div", "span", "section", "br", "hr",
];
const ALLOWED_ATTR = [
  "href", "src", "alt", "class", "target", "rel",
  "width", "height", "loading",
];

/** Etiket için tutarlı renk sınıfı seçer (Stitch tasarımından) */
function tagStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: `${color}18`, // ~10% opacity
    color,
    borderColor: `${color}33`,     // ~20% opacity
  };
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost]       = useState<BlogPostDetail | null>(null);
  const [related, setRelated] = useState<BlogPostList[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useDocumentMeta(
    post ? `${post.title} — Portföy` : undefined,
    post?.meta_description || post?.summary || undefined,
  );

  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug)
      .then((data) => {
        setPost(data);
        incrementViewCount(slug).catch(() => {});
        getRelatedPosts(slug).then(setRelated).catch(() => setRelated([]));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-[100px] pb-20 px-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-surface-variant rounded w-3/4" />
          <div className="h-4 bg-surface-variant rounded w-1/3" />
          <div className="h-64 bg-surface-variant rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="pt-[100px] pb-20 px-6 max-w-3xl mx-auto text-center">
        <p className="text-on-surface-variant text-[16px]">Yazı bulunamadı.</p>
        <Link to="/blog" className="text-primary text-[14px] hover:underline mt-4 inline-block">
          ← Blog'a dön
        </Link>
      </div>
    );
  }

  const cleanContent = DOMPurify.sanitize(post.content_html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  return (
    <main className="pt-[100px] pb-20 px-6 max-w-3xl mx-auto">

      {/* ── Başlık bölümü ── */}
      <header className="mb-12">
        <h1
          className="text-[48px] leading-[1.1] font-bold tracking-[-0.02em] text-on-surface mb-6"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {post.title}
        </h1>

        {/* Meta satırı */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[12px] leading-none tracking-[0.02em] font-medium text-on-surface-variant"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {post.reading_time} dk okuma
            {" · "}
            {new Date(post.created_at).toLocaleDateString("tr-TR", {
              day: "numeric", month: "long", year: "numeric",
            })}
            {" · "}
            {post.view_count} görüntülenme
          </span>
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
              src={post.featured_image.file_url}
              alt={post.featured_image.alt_text || post.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </header>

      {/* ── Makale gövdesi ── */}
      <article
        className="prose max-w-none text-on-surface"
        dangerouslySetInnerHTML={{ __html: cleanContent }}
      />

      {/* ── İlgili yazılar ── */}
      {related.length > 0 && (
        <section className="mt-20 pt-12 border-t border-outline-variant">
          <h3
            className="text-[20px] font-semibold leading-[1.4] text-on-surface mb-6"
          >
            İlgili Yazılar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((rel) => (
              <Link
                key={rel.id}
                to={`/blog/${rel.slug}`}
                className="block bg-surface border border-outline-variant rounded-lg p-3 hover:bg-surface-container-low transition-colors duration-150 group"
              >
                {/* Görsel veya placeholder */}
                <div className="h-32 bg-surface-variant rounded mb-3 overflow-hidden">
                  {rel.featured_image ? (
                    <img
                      src={rel.featured_image.file_url}
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
                  {new Date(rel.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                  {" · "}
                  {rel.reading_time} dk
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Geri dön ── */}
      <div className="mt-20 pt-12 border-t border-outline-variant flex justify-center">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity text-[14px] font-medium group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform duration-150">
            arrow_back
          </span>
          Tüm yazılara dön
        </Link>
      </div>
    </main>
  );
}

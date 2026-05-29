import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";

import api from "../../api/axiosInstance";
import { getPosts } from "../../api/posts";
import NewsletterWidget from "../../components/NewsletterWidget";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { BlogPostList, Category, PaginatedResponse, Tag } from "../../types";

export default function BlogListPage() {
  const { t, i18n } = useTranslation();
  const { lang = "tr" } = useParams<{ lang: string }>();
  useDocumentMeta(t("blog.title") + " — Portföy", t("blog.description"));

  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Filtre değerleri (URL'den) ── */
  const search         = searchParams.get("search")   ?? "";
  const activeCategory = searchParams.get("category") ?? "";
  const activeTag      = searchParams.get("tag")      ?? "";

  /* ── UI durumu ── */
  const [searchInput, setSearchInput] = useState(search);
  const [posts,       setPosts]       = useState<BlogPostList[]>([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [hasMore,     setHasMore]     = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [tags,        setTags]        = useState<Tag[]>([]);

  /* ── Kategoriler + Taglar bir kez yükle ── */
  useEffect(() => {
    api.get<PaginatedResponse<Category>>("/api/categories/")
      .then((r) => setCategories(r.data.results))
      .catch(() => {});
    api.get<PaginatedResponse<Tag>>("/api/tags/")
      .then((r) => setTags(r.data.results))
      .catch(() => {});
  }, []);

  /* ── Arama debounce: 400ms sonra URL'e yaz ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) next.set("search", searchInput.trim());
        else next.delete("search");
        return next;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  /* ── Filtre değişince listeyi sıfırla ve ilk sayfayı yükle ── */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setPosts([]);
    setCurrentPage(1);

    const params: Record<string, string> = { page: "1", page_size: "10" };
    if (search)         params.search              = search;
    if (activeCategory) params["categories__slug"] = activeCategory;
    if (activeTag)      params["tags__slug"]        = activeTag;

    getPosts(params)
      .then((d) => {
        setPosts(d.results);
        setTotalCount(d.count);
        setHasMore(!!d.next);
      })
      .finally(() => setLoading(false));
  }, [search, activeCategory, activeTag]);

  /* ── Daha fazla yükle ── */
  const handleLoadMore = () => {
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const params: Record<string, string> = {
      page: String(nextPage),
      page_size: "10",
    };
    if (search)         params.search              = search;
    if (activeCategory) params["categories__slug"] = activeCategory;
    if (activeTag)      params["tags__slug"]        = activeTag;

    getPosts(params)
      .then((d) => {
        setPosts((prev) => [...prev, ...d.results]);
        setCurrentPage(nextPage);
        setHasMore(!!d.next);
      })
      .finally(() => setLoadingMore(false));
  };

  /* ── Filtre yardımcıları ── */
  const setFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const hasActiveFilters = !!(search || activeCategory || activeTag);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Başlık + sonuç sayısı */}
      <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">{t("blog.title")}</h1>
        {!loading && (
          <span
            className="text-[13px] text-on-surface-variant"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {totalCount} {i18n.language === "en" ? (totalCount === 1 ? "post" : "posts") : "yazı"}
          </span>
        )}
      </div>

      {/* Arama */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
          search
        </span>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-sm bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          placeholder={t("blog.search")}
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Kategoriler */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter("category", "")}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              !activeCategory
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface"
            }`}
          >
            {t("common.all")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter("category", activeCategory === c.slug ? "" : c.slug)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                activeCategory === c.slug
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface"
              }`}
            >
              {c.name}
              <span className="ml-1 opacity-50">({c.post_count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Etiketler */}
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter("tag", activeTag === t.slug ? "" : t.slug)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                activeTag && activeTag !== t.slug ? "opacity-30" : "opacity-100"
              }`}
              style={{
                backgroundColor: `${t.color}18`,
                color: t.color,
                borderColor: `${t.color}33`,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Aktif filtreler şeridi */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap mb-6 py-2.5 px-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-[12px] text-on-surface-variant mr-1">{t("common.filters")}:</span>

          {search && (
            <span className="inline-flex items-center gap-1 text-[12px] bg-surface border border-outline-variant px-2 py-0.5 rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px]">search</span>
              &quot;{search}&quot;
              <button onClick={() => setSearchInput("")} className="hover:text-on-surface ml-0.5">
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            </span>
          )}

          {activeCategory && (
            <span className="inline-flex items-center gap-1 text-[12px] bg-surface border border-outline-variant px-2 py-0.5 rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px]">folder</span>
              {categories.find((c) => c.slug === activeCategory)?.name ?? activeCategory}
              <button onClick={() => setFilter("category", "")} className="hover:text-on-surface ml-0.5">
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            </span>
          )}

          {activeTag && (
            <span className="inline-flex items-center gap-1 text-[12px] bg-surface border border-outline-variant px-2 py-0.5 rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px]">label</span>
              {tags.find((t) => t.slug === activeTag)?.name ?? activeTag}
              <button onClick={() => setFilter("tag", "")} className="hover:text-on-surface ml-0.5">
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            </span>
          )}

          <button
            onClick={clearFilters}
            className="ml-auto text-[12px] text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
            {t("common.clearAll")}
          </button>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse border border-outline-variant rounded-xl p-6 bg-surface">
              <div className="h-5 bg-surface-variant rounded w-2/3 mb-3" />
              <div className="h-4 bg-surface-variant rounded w-full mb-2" />
              <div className="h-4 bg-surface-variant rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">article</span>
          <p className="text-[15px]">{t("blog.noResults")}</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-primary text-[13px] mt-3 hover:underline">
              {t("common.clearAll")}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border border-outline-variant rounded-xl p-6 bg-surface hover:border-primary/30 hover:bg-surface-container-low transition-all"
              >
                {post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {post.categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setFilter("category", activeCategory === c.slug ? "" : c.slug)}
                        className="text-xs text-primary font-medium hover:underline"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
                <h2 className="text-xl font-semibold text-on-surface mb-2 tracking-tight">
                  <Link to={`/${lang}/blog/${post.slug}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-on-surface-variant text-sm mb-4 leading-relaxed">{post.summary}</p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2 flex-wrap">
                    {post.tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => setFilter("tag", activeTag === tag.slug ? "" : tag.slug)}
                        className="text-xs px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `${tag.color}18`,
                          color: tag.color,
                          borderColor: `${tag.color}33`,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-3 text-xs text-outline shrink-0"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    <span>{t("blog.readingTime", { min: post.reading_time })}</span>
                    <time>{new Date(post.created_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR")}</time>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Daha fazla yükle */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    {t("common.loadMore")}
                    <span
                      className="text-[11px] text-outline"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      ({posts.length}/{totalCount})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Liste sonu */}
          {!hasMore && posts.length > 0 && posts.length === totalCount && totalCount > 10 && (
            <p
              className="text-center text-[12px] text-outline mt-8"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              — {i18n.language === "en" ? `All ${totalCount} posts loaded` : `Tüm ${totalCount} yazı yüklendi`} —
            </p>
          )}
        </>
      )}

      {/* Newsletter abonelik formu */}
      <div className="mt-16 border-t border-outline-variant pt-12">
        <NewsletterWidget />
      </div>
    </div>
  );
}

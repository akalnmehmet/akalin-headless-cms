import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import api from "../../api/axiosInstance";
import { getPosts } from "../../api/posts";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { BlogPostList, Category, PaginatedResponse, Tag } from "../../types";

export default function BlogListPage() {
  useDocumentMeta("Blog — Portföy", "Yazılım, robotik ve DevOps üzerine yazılar.");
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResponse<BlogPostList> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const page = searchParams.get("page") ?? "1";
  const search = searchParams.get("search") ?? "";
  const activeCategory = searchParams.get("category") ?? "";
  const activeTag = searchParams.get("tag") ?? "";

  useEffect(() => {
    api.get<PaginatedResponse<Category>>("/api/categories/").then((r) => setCategories(r.data.results));
    api.get<PaginatedResponse<Tag>>("/api/tags/").then((r) => setTags(r.data.results));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page };
    if (search) params.search = search;
    if (activeCategory) params["categories__slug"] = activeCategory;
    if (activeTag) params["tags__slug"] = activeTag;

    getPosts(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search, activeCategory, activeTag]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Blog</h1>

      {/* Arama */}
      <div className="mb-6">
        <input
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Yazılarda ara..."
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") setFilter("search", (e.target as HTMLInputElement).value);
          }}
        />
      </div>

      {/* Kategoriler */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter("category", "")}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              !activeCategory ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-400"
            }`}
          >
            Tümü
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter("category", activeCategory === c.slug ? "" : c.slug)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                activeCategory === c.slug
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-200 text-gray-600 hover:border-blue-400"
              }`}
            >
              {c.name}
              <span className="ml-1 opacity-60">({c.post_count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Etiketler */}
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter("tag", activeTag === t.slug ? "" : t.slug)}
              className={`text-xs px-2.5 py-1 rounded-full text-white transition-opacity ${
                activeTag && activeTag !== t.slug ? "opacity-40" : "opacity-100"
              }`}
              style={{ backgroundColor: t.color }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : data?.count === 0 ? (
        <div className="text-center py-12 text-gray-400">Sonuç bulunamadı.</div>
      ) : (
        <div className="space-y-6">
          {data?.results.map((post) => (
            <article key={post.id} className="border border-gray-100 rounded-xl p-6 hover:shadow-sm hover:border-gray-200 transition-all">
              <div className="flex flex-wrap gap-2 mb-3">
                {post.categories.map((c) => (
                  <span key={c.id} className="text-xs text-blue-600 font-medium">{c.name}</span>
                ))}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">{post.summary}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      onClick={() => setFilter("tag", activeTag === tag.slug ? "" : tag.slug)}
                      className="text-xs px-2 py-0.5 rounded-full text-white cursor-pointer"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                  <span>{post.reading_time} dk</span>
                  <time>{new Date(post.created_at).toLocaleDateString("tr-TR")}</time>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Sayfalama */}
      {data && (data.next || data.previous) && (
        <div className="flex justify-center gap-3 mt-10">
          {data.previous && (
            <button
              onClick={() => setFilter("page", String(Number(page) - 1))}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              ← Önceki
            </button>
          )}
          {data.next && (
            <button
              onClick={() => setFilter("page", String(Number(page) + 1))}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Sonraki →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

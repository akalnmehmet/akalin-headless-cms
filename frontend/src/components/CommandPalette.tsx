import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import api from "../api/axiosInstance";
import type { BlogPostList, PaginatedResponse, Project } from "../types";

interface SearchResult {
  type: "post" | "project";
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  icon: string;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lang = pathname.split("/")[1] === "en" ? "en" : "tr";

  // Cmd+K / Ctrl+K ile aç; ayrıca custom "open-command-palette" event'i dinle
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const openHandler = () => setOpen(true);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("open-command-palette", openHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("open-command-palette", openHandler);
    };
  }, []);

  // Açılınca input'a focus
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced arama
  const search = useCallback((q: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer = setTimeout(async () => {
      try {
        const [postsRes, projectsRes] = await Promise.all([
          api.get<PaginatedResponse<BlogPostList>>(`/api/posts/?search=${encodeURIComponent(q)}&page_size=5`),
          api.get<PaginatedResponse<Project>>(`/api/projects/?search=${encodeURIComponent(q)}&page_size=5`),
        ]);

        const postResults: SearchResult[] = postsRes.data.results.map((p) => ({
          type: "post",
          id: p.id,
          title: p.title,
          subtitle: p.summary?.slice(0, 80) || undefined,
          slug: p.slug,
          icon: "article",
        }));

        const projectResults: SearchResult[] = projectsRes.data.results.map((p) => ({
          type: "project",
          id: p.id,
          title: p.title,
          subtitle: (p.tech_stack as string[]).slice(0, 4).join(" · ") || undefined,
          slug: p.slug,
          icon: "code",
        }));

        setResults([...postResults, ...projectResults]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, []);

  // Query değişince ara
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search(query);
  }, [query, search]);

  // Ok tuşları + Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      navigate(
        results[activeIdx].type === "post"
          ? `/${lang}/blog/${results[activeIdx].slug}`
          : `/${lang}/projects/${results[activeIdx].slug}`
      );
      setOpen(false);
    }
  };

  const goTo = (result: SearchResult) => {
    navigate(result.type === "post" ? `/${lang}/blog/${result.slug}` : `/${lang}/projects/${result.slug}`);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Komut paleti"
        className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-[61] w-full max-w-xl mx-4"
      >
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">

          {/* Arama kutusu */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Blog yazısı veya proje ara..."
              className="flex-1 bg-transparent text-on-surface text-[15px] placeholder:text-on-surface-variant/50 outline-none"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
              onKeyDown={handleKeyDown}
            />
            {loading && (
              <span
                className="material-symbols-outlined text-[18px] text-on-surface-variant animate-spin"
                style={{ animationDuration: "0.8s" }}
              >
                progress_activity
              </span>
            )}
            <kbd className="hidden sm:inline text-[11px] text-on-surface-variant border border-outline-variant rounded px-1.5 py-0.5 bg-surface-container shrink-0">
              ESC
            </kbd>
          </div>

          {/* Sonuçlar */}
          <div className="max-h-[320px] overflow-y-auto">
            {!query.trim() ? (
              /* İpucu: boşken */
              <div className="px-4 py-6 text-center">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/30 block mb-2">
                  manage_search
                </span>
                <p className="text-[13px] text-on-surface-variant">
                  Yazmaya başla — blog yazıları ve projelerde arar
                </p>
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="px-4 py-6 text-center text-[13px] text-on-surface-variant">
                "<span className="text-on-surface">{query}</span>" için sonuç bulunamadı.
              </div>
            ) : (
              <ul role="listbox">
                {results.map((result, idx) => (
                  <li
                    key={`${result.type}-${result.id}`}
                    role="option"
                    aria-selected={idx === activeIdx}
                    onClick={() => goTo(result)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-100 ${
                      idx === activeIdx
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${
                        idx === activeIdx ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {result.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium leading-snug truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p
                          className={`text-[12px] mt-0.5 truncate ${
                            idx === activeIdx ? "text-primary/70" : "text-on-surface-variant"
                          }`}
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span
                      className={`ml-auto text-[11px] shrink-0 mt-0.5 ${
                        idx === activeIdx ? "text-primary/60" : "text-on-surface-variant/50"
                      }`}
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {result.type === "post" ? "Blog" : "Proje"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1">
                <kbd className="border border-outline-variant rounded px-1 py-0.5 bg-surface text-[10px]">↑↓</kbd>
                seç
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-outline-variant rounded px-1 py-0.5 bg-surface text-[10px]">↵</kbd>
                git
              </span>
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {results.length > 0 && `${results.length} sonuç`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, FileText, FolderGit2 } from "lucide-react";

import { searchAll } from "../api/analytics";
import type { SearchResult } from "../api/analytics";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
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
    };
    const openHandler = () => setOpen(true);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("open-command-palette", openHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("open-command-palette", openHandler);
    };
  }, []);

  // Açılınca sıfırla
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults([]);
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
        const res = await searchAll(q);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search(query);
  }, [query, search]);

  const goTo = (result: SearchResult) => {
    navigate(result.type === "post" ? `/${lang}/blog/${result.slug}` : `/${lang}/projects/${result.slug}`);
    setOpen(false);
  };

  const posts = results.filter((r) => r.type === "post");
  const projects = results.filter((r) => r.type === "project");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="relative">
        <CommandInput
          placeholder="Blog yazısı veya proje ara..."
          value={query}
          onValueChange={(v) => { setQuery(v); }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />
          </div>
        )}
      </div>

      <CommandList>
        {!query.trim() ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
              Yazmaya başla — blog yazıları ve projelerde arar
            </p>
          </div>
        ) : (
          <>
            <CommandEmpty>
              {!loading && (
                <span>
                  &quot;<span className="text-[hsl(var(--foreground))]">{query}</span>&quot; için sonuç bulunamadı.
                </span>
              )}
            </CommandEmpty>

            {posts.length > 0 && (
              <CommandGroup heading="Blog Yazıları">
                {posts.map((result) => (
                  <CommandItem
                    key={`post-${result.id}`}
                    value={`${result.title} ${result.subtitle ?? ""}`}
                    onSelect={() => goTo(result)}
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium leading-snug truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <CommandShortcut>Blog</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {projects.length > 0 && (
              <CommandGroup heading="Projeler">
                {projects.map((result) => (
                  <CommandItem
                    key={`project-${result.id}`}
                    value={`${result.title} ${result.subtitle ?? ""}`}
                    onSelect={() => goTo(result)}
                    className="cursor-pointer"
                  >
                    <FolderGit2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium leading-snug truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <CommandShortcut>Proje</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <div className="flex items-center gap-3 text-[11px] text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1">
            <kbd className="border border-[hsl(var(--border))] rounded px-1 py-0.5 bg-[hsl(var(--card))] text-[10px]">↑↓</kbd>
            seç
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-[hsl(var(--border))] rounded px-1 py-0.5 bg-[hsl(var(--card))] text-[10px]">↵</kbd>
            git
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-[hsl(var(--border))] rounded px-1 py-0.5 bg-[hsl(var(--card))] text-[10px]">ESC</kbd>
            kapat
          </span>
        </div>
        {results.length > 0 && (
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
            {results.length} sonuç
          </span>
        )}
      </div>
    </CommandDialog>
  );
}

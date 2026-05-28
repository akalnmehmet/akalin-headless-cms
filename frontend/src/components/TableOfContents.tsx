import { useEffect, useRef, useState } from "react";

import type { TocItem } from "../utils/tocUtils";

export type { TocItem };

interface Props {
  items: TocItem[];
  /** "mobile" → yalnızca mobil accordion | "desktop" → yalnızca sticky sidebar */
  variant?: "mobile" | "desktop";
}

export default function TableOfContents({ items, variant = "mobile" }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const headingEls = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
           
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-64px 0px -60% 0px", threshold: 0 }
    );

    headingEls.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
     
    setMobileOpen(false);
  };

  if (items.length === 0) return null;

  // ── Mobil collapsible accordion ──────────────────────────────────────────
  if (variant === "mobile") {
    return (
      <div className="mb-8 border border-outline-variant rounded-xl overflow-hidden bg-surface">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">toc</span>
            İçindekiler
          </span>
          <span
            className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
              mobileOpen ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </button>

        <div
          className={`transition-all duration-200 ease-in-out overflow-hidden ${
            mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="px-4 pb-4 space-y-1 border-t border-outline-variant pt-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left text-[13px] leading-[1.6] transition-colors duration-150
                    ${item.level === 3 ? "pl-4" : "pl-0"}
                    ${
                      activeId === item.id
                        ? "text-primary font-medium"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ── Desktop sticky sidebar ────────────────────────────────────────────────
  return (
    <aside>
      <div className="sticky top-[88px] max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[16px] text-primary">toc</span>
          <span
            className="text-[11px] font-semibold tracking-[0.06em] uppercase text-on-surface-variant"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            İçindekiler
          </span>
        </div>

        <div className="border-l-2 border-outline-variant pl-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              {activeId === item.id && (
                <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />
              )}
              <button
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left py-1 text-[12px] leading-[1.5] transition-colors duration-150
                  ${item.level === 3 ? "pl-3 opacity-75" : "pl-0"}
                  ${
                    activeId === item.id
                      ? "text-primary font-semibold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
              >
                {item.text}
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

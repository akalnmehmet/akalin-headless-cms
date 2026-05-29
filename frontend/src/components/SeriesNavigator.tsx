import { Link, useParams } from "react-router-dom";
import type { SeriesInfo } from "../types";

interface Props {
  info: SeriesInfo;
  currentSlug: string;
}

export default function SeriesNavigator({ info, currentSlug }: Props) {
  const { lang = "tr" } = useParams<{ lang: string }>();

  const ordered  = [...info.posts].sort((a, b) => (a.series_order ?? 0) - (b.series_order ?? 0));
  const curIndex = ordered.findIndex((p) => p.slug === currentSlug);
  const prev     = curIndex > 0 ? ordered[curIndex - 1] : null;
  const next     = curIndex < ordered.length - 1 ? ordered[curIndex + 1] : null;

  return (
    <div className="my-8 rounded-2xl border border-outline-variant bg-surface-container-low overflow-hidden">
      {/* Başlık */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant bg-surface-container">
        <span
          className="material-symbols-outlined text-[18px] text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          collections_bookmark
        </span>
        <div>
          <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.06em] font-medium"
            style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Seri
          </p>
          <p className="text-[14px] font-semibold text-on-surface leading-tight">{info.title}</p>
        </div>
        <span className="ml-auto text-[11px] text-on-surface-variant font-mono">
          {ordered.length} yazı
        </span>
      </div>

      {/* Yazı listesi */}
      <ol className="divide-y divide-outline-variant/50">
        {ordered.map((post, idx) => {
          const isCurrent = post.slug === currentSlug;
          return (
            <li key={post.id}>
              {isCurrent ? (
                <div className="flex items-center gap-3 px-5 py-3 bg-primary/5">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center
                               text-[10px] font-bold text-on-primary"
                  >
                    {idx + 1}
                  </span>
                  <span className="text-[13px] font-semibold text-primary flex-1 leading-snug">
                    {post.title}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    play_arrow
                  </span>
                </div>
              ) : (
                <Link
                  to={`/${lang}/blog/${post.slug}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container transition-colors group"
                >
                  <span
                    className="shrink-0 w-5 h-5 rounded-full border border-outline-variant flex items-center
                               justify-center text-[10px] font-medium text-on-surface-variant
                               group-hover:border-primary/40 group-hover:text-primary transition-colors"
                  >
                    {idx + 1}
                  </span>
                  <span className="text-[13px] text-on-surface-variant group-hover:text-on-surface transition-colors flex-1 leading-snug">
                    {post.title}
                  </span>
                  <span className="text-[11px] text-outline font-mono">{post.reading_time}dk</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Önceki / Sonraki */}
      {(prev || next) && (
        <div className="flex border-t border-outline-variant">
          {prev ? (
            <Link
              to={`/${lang}/blog/${prev.slug}`}
              className="flex-1 flex items-center gap-2 px-4 py-3 text-on-surface-variant
                         hover:bg-surface-container transition-colors group"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:text-primary transition-colors">
                arrow_back
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-outline uppercase tracking-[0.05em] font-mono">Önceki</p>
                <p className="text-[12px] text-on-surface truncate group-hover:text-primary transition-colors">
                  {prev.title}
                </p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {prev && next && <div className="w-px bg-outline-variant" />}

          {next && (
            <Link
              to={`/${lang}/blog/${next.slug}`}
              className="flex-1 flex items-center justify-end gap-2 px-4 py-3 text-right
                         text-on-surface-variant hover:bg-surface-container transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-[10px] text-outline uppercase tracking-[0.05em] font-mono">Sonraki</p>
                <p className="text-[12px] text-on-surface truncate group-hover:text-primary transition-colors">
                  {next.title}
                </p>
              </div>
              <span className="material-symbols-outlined text-[16px] group-hover:text-primary transition-colors shrink-0">
                arrow_forward
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { getReactions, toggleReaction } from "../api/reactions";
import type { ReactionCounts } from "../types";

const EMOJIS: { key: keyof ReactionCounts; emoji: string; label: string }[] = [
  { key: "like",     emoji: "👍", label: "Beğen"  },
  { key: "heart",    emoji: "❤️", label: "Kalp"   },
  { key: "fire",     emoji: "🔥", label: "Ateş"   },
  { key: "thinking", emoji: "🤔", label: "Düşünce" },
  { key: "clap",     emoji: "👏", label: "Alkış"  },
];

interface Props {
  slug: string;
}

export default function ReactionBar({ slug }: Props) {
  const [counts, setCounts] = useState<ReactionCounts | null>(null);
  const [mine, setMine]     = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    getReactions(slug)
      .then((r) => { setCounts(r.counts); setMine(r.mine); })
      .catch(() => {});
  }, [slug]);

  const handleToggle = async (emoji: string) => {
    if (pending) return;
    setPending(emoji);
    try {
      const r = await toggleReaction(slug, emoji);
      setCounts(r.counts);
      setMine(r.mine);
    } catch {
      // ignore
    } finally {
      setPending(null);
    }
  };

  if (!counts) return null;

  return (
    <div className="my-8 flex flex-wrap items-center gap-2">
      <span className="text-[11px] text-on-surface-variant font-mono uppercase tracking-[0.06em] mr-1">
        Tepki ver
      </span>
      {EMOJIS.map(({ key, emoji, label }) => {
        const active = mine.includes(key);
        const count  = counts[key];
        return (
          <button
            key={key}
            onClick={() => handleToggle(key)}
            disabled={pending === key}
            aria-label={label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] transition-all duration-150
              ${active
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary/30 hover:bg-surface-container"
              }
              ${pending === key ? "opacity-60 cursor-wait" : "cursor-pointer"}
            `}
          >
            <span className="text-[16px] leading-none">{emoji}</span>
            {count > 0 && (
              <span className="text-[12px] font-mono leading-none">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

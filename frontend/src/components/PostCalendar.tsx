import { useState } from "react";
import type { BlogPostAdmin } from "../types";

interface Props {
  posts: BlogPostAdmin[];
  onEditPost: (post: BlogPostAdmin) => void;
}

const DAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "#10b981",
  DRAFT:     "#f59e0b",
  ARCHIVED:  "#64748b",
};

export default function PostCalendar({ posts, onEditPost }: Props) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Haftanın başı Pazartesi (0=Pt, 6=Pz)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells  = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  // publish_at veya created_at olan postları bu aya göre gruplama
  const postsByDay = new Map<number, BlogPostAdmin[]>();
  posts.forEach((p) => {
    const dateStr = p.publish_at || p.created_at;
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!postsByDay.has(day)) postsByDay.set(day, []);
      postsByDay.get(day)!.push(p);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
    return dayNum;
  });

  return (
    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
      {/* Başlık */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <h2 className="text-[15px] font-semibold text-on-surface min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
        <button
          onClick={goToday}
          className="text-[11px] font-mono text-on-surface-variant hover:text-primary transition-colors px-2 py-1 border border-outline-variant rounded"
        >
          Bugün
        </button>
      </div>

      {/* Gün isimleri */}
      <div className="grid grid-cols-7 border-b border-outline-variant">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-outline tracking-[0.06em] uppercase font-mono">
            {d}
          </div>
        ))}
      </div>

      {/* Hücreler */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const dayPosts = day ? (postsByDay.get(day) ?? []) : [];
          return (
            <div
              key={idx}
              className={`min-h-[72px] p-1.5 border-b border-r border-outline-variant/40 ${
                day ? "bg-surface" : "bg-surface-container/30"
              } ${idx % 7 === 6 ? "border-r-0" : ""}`}
            >
              {day && (
                <>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-mono mb-1 ${
                    isToday
                      ? "bg-primary text-on-primary font-bold"
                      : "text-on-surface-variant"
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 2).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onEditPost(p)}
                        title={p.title}
                        className="w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight truncate transition-opacity hover:opacity-80"
                        style={{
                          background: `${STATUS_COLOR[p.status]}18`,
                          color: STATUS_COLOR[p.status],
                          borderLeft: `2px solid ${STATUS_COLOR[p.status]}`,
                        }}
                      >
                        {p.title}
                      </button>
                    ))}
                    {dayPosts.length > 2 && (
                      <span className="text-[9px] text-outline font-mono pl-1">
                        +{dayPosts.length - 2} daha
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Açıklama */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-outline-variant bg-surface-container-low">
        {Object.entries({ PUBLISHED: "Yayında", DRAFT: "Taslak", ARCHIVED: "Arşiv" }).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS_COLOR[key] }} />
            <span className="text-[10px] text-on-surface-variant font-mono">{label}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-outline font-mono">
          {posts.filter((p) => p.publish_at).length} planlanmış yazı
        </span>
      </div>
    </div>
  );
}

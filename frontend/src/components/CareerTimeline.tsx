import { useTranslation } from "react-i18next";
import type { CareerEntry, CareerEntryType } from "../types";

interface Props {
  entries: CareerEntry[];
  limit?: number;            // ilk N kayıt göster (ana sayfa özeti için)
}

const TYPE_CONFIG: Record<CareerEntryType, { labelKey: string; color: string; icon: string }> = {
  WORK:      { labelKey: "career.type.WORK",      color: "#00d4ff", icon: "work"      },
  EDUCATION: { labelKey: "career.type.EDUCATION", color: "#7c3aed", icon: "school"    },
  VOLUNTEER: { labelKey: "career.type.VOLUNTEER", color: "#10b981", icon: "volunteer_activism" },
};

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "tr-TR", { month: "short", year: "numeric" });
}

function DateRange({ entry, lang, presentText }: { entry: CareerEntry; lang: string; presentText: string }) {
  return (
    <span
      className="text-[12px] text-on-surface-variant"
      style={{ fontFamily: "JetBrains Mono, monospace" }}
    >
      {formatDate(entry.start_date, lang)}
      {" — "}
      {entry.is_current ? (
        <span className="text-tertiary font-semibold">{presentText}</span>
      ) : (
        entry.end_date ? formatDate(entry.end_date, lang) : "—"
      )}
    </span>
  );
}

export default function CareerTimeline({ entries, limit }: Props) {
  const { t, i18n } = useTranslation();
  const visible = limit ? entries.slice(0, limit) : entries;

  if (visible.length === 0) return null;

  return (
    <div className="relative">
      {/* Dikey çizgi */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-outline-variant" aria-hidden="true" />

      <div className="space-y-0">
        {visible.map((entry, idx) => {
          const cfg = TYPE_CONFIG[entry.entry_type];
          const isLast = idx === visible.length - 1;

          return (
            <div key={entry.id} className={`relative flex gap-6 ${isLast ? "" : "pb-8"}`}>

              {/* Nokta — timeline işareti */}
              <div className="relative z-10 shrink-0 mt-1">
                <div
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: `${cfg.color}15`,
                    borderColor: `${cfg.color}50`,
                  }}
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ color: cfg.color }}
                  >
                    {cfg.icon}
                  </span>
                </div>
              </div>

              {/* Kart */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="bg-surface border border-outline-variant rounded-xl p-5 hover:border-primary/30 transition-colors duration-150">

                  {/* Üst satır: tip badge + tarih */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${cfg.color}15`,
                        color: cfg.color,
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {t(cfg.labelKey)}
                    </span>
                    <DateRange entry={entry} lang={i18n.language} presentText={t("career.present")} />
                  </div>

                  {/* Pozisyon + Şirket */}
                  <h3 className="text-[16px] font-semibold text-on-surface leading-snug">
                    {entry.position}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 mb-3">
                    <span className="text-[14px] text-primary font-medium">{entry.company}</span>
                    {entry.location && (
                      <>
                        <span className="text-outline text-[12px]">·</span>
                        <span className="text-[13px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {entry.location}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Açıklama */}
                  {entry.description && (
                    <p className="text-[14px] text-on-surface-variant leading-relaxed mb-3">
                      {entry.description}
                    </p>
                  )}

                  {/* Tech stack */}
                  {entry.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tech_stack.map((tech) => (
                        <span
                          key={tech}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant"
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

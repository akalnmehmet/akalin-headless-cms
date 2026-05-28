import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getCareer } from "../../api/career";
import CareerTimeline from "../../components/CareerTimeline";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { CareerEntry } from "../../types";

export default function CareerPage() {
  const { t } = useTranslation();
  useDocumentMeta(t("career.title") + " — Portföy", t("career.description"));
  const [entries, setEntries] = useState<CareerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCareer()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  const workEntries = entries.filter((e) => e.entry_type === "WORK");
  const educationEntries = entries.filter((e) => e.entry_type === "EDUCATION");
  const volunteerEntries = entries.filter((e) => e.entry_type === "VOLUNTEER");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-on-surface mb-3 tracking-tight">{t("career.title")}</h1>
      <p className="text-on-surface-variant mb-12 text-[15px]">
        {t("career.description")}
      </p>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-6">
              <div className="w-10 h-10 rounded-full bg-surface-variant animate-pulse shrink-0 mt-1" />
              <div className="flex-1 border border-outline-variant rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-surface-variant rounded w-1/4 mb-3" />
                <div className="h-5 bg-surface-variant rounded w-2/3 mb-2" />
                <div className="h-4 bg-surface-variant rounded w-full mb-1" />
                <div className="h-4 bg-surface-variant rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-14">
          {/* İş Deneyimi */}
          {workEntries.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-on-surface-variant mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">work</span>
                {t("career.type.WORK")}
              </h2>
              <CareerTimeline entries={workEntries} />
            </section>
          )}

          {/* Eğitim */}
          {educationEntries.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-on-surface-variant mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]" style={{ color: "#7c3aed" }}>school</span>
                {t("career.type.EDUCATION")}
              </h2>
              <CareerTimeline entries={educationEntries} />
            </section>
          )}

          {/* Gönüllülük */}
          {volunteerEntries.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-on-surface-variant mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]" style={{ color: "#10b981" }}>volunteer_activism</span>
                {t("career.type.VOLUNTEER")}
              </h2>
              <CareerTimeline entries={volunteerEntries} />
            </section>
          )}

          {entries.length === 0 && (
            <p className="text-on-surface-variant text-center py-12">{t("career.noEntries")}</p>
          )}
        </div>
      )}
    </div>
  );
}

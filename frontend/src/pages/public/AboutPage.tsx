import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getCareer } from "../../api/career";
import { getSiteSettings } from "../../api/settings";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { clImg } from "../../utils/cloudinary";
import type { CareerEntry, SiteSettings } from "../../types";

const ENTRY_TYPE_LABEL: Record<string, string> = {
  WORK: "career.type.WORK",
  EDUCATION: "career.type.EDUCATION",
  VOLUNTEER: "career.type.VOLUNTEER",
};

const ENTRY_TYPE_COLOR: Record<string, string> = {
  WORK: "#00d4ff",
  EDUCATION: "#7c3aed",
  VOLUNTEER: "#10b981",
};

function dateRange(entry: CareerEntry, lang: string, presentText: string): string {
  const fmt = (d: string) => {
    const [y, m] = d.split("-");
    return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "tr-TR", { month: "long", year: "numeric" }).format(
      new Date(Number(y), Number(m) - 1)
    );
  };
  return `${fmt(entry.start_date)} — ${entry.is_current ? presentText : entry.end_date ? fmt(entry.end_date) : "?"}`;
}

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [career,   setCareer]   = useState<CareerEntry[]>([]);
  const [loading,  setLoading]  = useState(true);

  useDocumentMeta({
    title:       settings ? `${settings.owner_name} — ${t("about.title")}` : `${t("about.title")} — Portföy`,
    description: settings?.about_bio || settings?.owner_bio || undefined,
  });

  useEffect(() => {
    Promise.all([getSiteSettings(), getCareer()])
      .then(([s, c]) => { setSettings(s); setCareer(c); })
      .finally(() => setLoading(false));
  }, []);

  const grouped = career.reduce<Record<string, CareerEntry[]>>((acc, e) => {
    (acc[e.entry_type] ??= []).push(e);
    return acc;
  }, {});

  const entryOrder: Array<CareerEntry["entry_type"]> = ["WORK", "EDUCATION", "VOLUNTEER"];

  if (loading) {
    return (
      <div className="pt-[100px] pb-24 px-4 max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-12 bg-surface-variant rounded w-1/2" />
        <div className="h-4 bg-surface-variant rounded w-3/4" />
        <div className="h-32 bg-surface-variant rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* CV indirme butonu — sadece cv_url varsa göster */}
      {settings?.cv_url && (
        <div className="print:hidden fixed bottom-8 right-6 z-50">
          <a
            href={settings.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary shadow-lg text-[13px] font-semibold hover:opacity-90 transition-opacity duration-200"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {t("about.downloadCV")}
          </a>
        </div>
      )}

      <div id="about-cv" className="pt-[100px] pb-24 px-4 sm:px-6 max-w-3xl mx-auto">

        {/* ── CV Başlık ── */}
        <header className="mb-12 print:mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profil Fotoğrafı */}
            {settings?.owner_image && (
              <div className="shrink-0 relative group print:hidden">
                {/* Arka plan parlama efekti */}
                <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl group-hover:bg-primary/20 transition-all duration-300 -z-10" />
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden border border-outline-variant bg-surface-container shadow-md transition-transform duration-300 group-hover:scale-[1.02]">
                  <img
                    src={clImg(settings.owner_image.file_url, "avatar")}
                    alt={settings.owner_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 text-center md:text-left min-w-0">
              <p
                className="print:hidden text-[12px] font-semibold tracking-[0.12em] text-primary uppercase mb-3"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                // {t("about.title").toLowerCase()}
              </p>
              <h1 className="text-[42px] sm:text-[52px] font-bold tracking-[-0.025em] text-on-surface leading-[1.05] mb-3 break-words">
                {settings?.owner_name ?? "—"}
              </h1>
              <p
                className="text-[16px] text-primary font-medium mb-4"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                {settings?.owner_title ?? ""}
              </p>
              {(settings?.about_bio || settings?.owner_bio) && (
                <p className="text-[15px] text-on-surface-variant leading-relaxed max-w-xl mx-auto md:mx-0">
                  {settings.about_bio || settings.owner_bio}
                </p>
              )}
            </div>

            {/* Linkler */}
            <div className="flex flex-col gap-2 print:hidden shrink-0 w-full md:w-auto mt-4 md:mt-0 items-center md:items-stretch">
              {settings?.github_url && (
                <a
                  href={settings.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-[12px] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors duration-150"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  <span className="material-symbols-outlined text-[15px]">code</span>
                  GitHub
                </a>
              )}
              {settings?.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-[12px] text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors duration-150"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  <span className="material-symbols-outlined text-[15px]">work</span>
                  LinkedIn
                </a>
              )}
              {settings?.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/08 text-[12px] text-primary hover:bg-primary/15 transition-colors duration-150"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  <span className="material-symbols-outlined text-[15px]">mail</span>
                  {settings.contact_email}
                </a>
              )}
            </div>
          </div>
        </header>

        {/* ── Beceriler ── */}
        {settings?.skills && settings.skills.length > 0 && (
          <section className="mb-12 print:mb-8">
            <h2 className="cv-section-title">{t("about.skills")}</h2>
            <div className="flex flex-wrap gap-2">
              {settings.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-[13px] font-medium px-3 py-1 rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant print:border print:border-gray-300 print:text-gray-700"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Kariyer bölümleri ── */}
        {entryOrder.map((type) => {
          const entries = grouped[type];
          if (!entries?.length) return null;
          const color = ENTRY_TYPE_COLOR[type];

          return (
            <section key={type} className="mb-12 print:mb-8">
              <h2 className="cv-section-title">{t(ENTRY_TYPE_LABEL[type])}</h2>
              <div className="relative space-y-0">
                {/* Dikey çizgi */}
                <div
                  className="absolute left-[7px] top-2 bottom-2 w-px print:hidden"
                  style={{ background: `${color}22` }}
                />

                {entries.map((entry) => (
                  <div key={entry.id} className="relative pl-8 pb-8 last:pb-0">
                    {/* Nokta */}
                    <div
                      className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 bg-surface print:hidden"
                      style={{ borderColor: color }}
                    />

                    <div className="bg-surface border border-outline-variant rounded-xl p-5 hover:border-primary/30 transition-colors duration-150 print:border print:border-gray-200 print:rounded print:shadow-none">
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
                        <div>
                          <h3 className="text-[16px] font-semibold text-on-surface">{entry.position}</h3>
                          <p className="text-[14px] font-medium mt-0.5" style={{ color }}>
                            {entry.company}
                            {entry.location && (
                              <span className="text-on-surface-variant font-normal"> · {entry.location}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {entry.is_current && (
                            <span
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${color}15`,
                                color,
                                fontFamily: "JetBrains Mono, monospace",
                              }}
                            >
                              {t("career.present")}
                            </span>
                          )}
                          <span
                            className="text-[11px] text-on-surface-variant"
                            style={{ fontFamily: "JetBrains Mono, monospace" }}
                          >
                            {dateRange(entry, i18n.language, t("career.present"))}
                          </span>
                        </div>
                      </div>

                      {entry.description && (
                        <p className="text-[13px] text-on-surface-variant leading-relaxed mt-2">
                          {entry.description}
                        </p>
                      )}

                      {entry.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {entry.tech_stack.map((t) => (
                            <span
                              key={t}
                              className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant print:border-gray-300 print:text-gray-600"
                              style={{ fontFamily: "JetBrains Mono, monospace" }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {career.length === 0 && !loading && (
          <p className="text-on-surface-variant text-[14px] py-8">{t("career.noEntries")}</p>
        )}

      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { getProjectBySlug, getProjects } from "../../api/projects";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { Project } from "../../types";

const STATUS_MAP: Record<string, { labelKey: string; color: string }> = {
  ACTIVE:      { labelKey: "projects.status.ACTIVE",   color: "#10b981" },
  IN_PROGRESS: { labelKey: "projects.status.IN_PROGRESS", color: "#f59e0b" },
  ARCHIVED:    { labelKey: "projects.status.ARCHIVED",    color: "#64748b" },
};

function formatDate(d: string | null, lang: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(lang === "en" ? "en-US" : "tr-TR", { month: "long", year: "numeric" });
}

export default function ProjectDetailPage() {
  const { t, i18n } = useTranslation();
  const { slug, lang = "tr" } = useParams<{ slug: string; lang: string }>();

  const [project,  setProject]  = useState<Project | null>(null);
  const [others,   setOthers]   = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useDocumentMeta(
    project ? `${project.title} — ${t("projects.title")}` : undefined,
    project?.description.slice(0, 160) ?? undefined,
  );

  useEffect(() => {
    if (!slug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setProject(null);

    getProjectBySlug(slug)
      .then((data) => {
        setProject(data);
        // Diğer projeleri yükle (arşiv hariç, kendisi hariç, maks 3)
        getProjects({ page_size: "20" })
          .then((res) =>
            setOthers(
              res.results
                .filter((p) => p.slug !== slug && p.status !== "ARCHIVED")
                .slice(0, 3),
            ),
          )
          .catch(() => {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Yükleniyor ── */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-4 bg-surface-variant rounded w-32" />
        <div className="h-[320px] bg-surface-variant rounded-2xl" />
        <div className="h-8 bg-surface-variant rounded w-1/2" />
        <div className="h-4 bg-surface-variant rounded w-full" />
        <div className="h-4 bg-surface-variant rounded w-3/4" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <p className="text-on-surface-variant text-[16px] mb-4">{t("projects.projectNotFound")}</p>
        <Link to={`/${lang}/projects`} className="text-primary hover:underline text-[14px]">
          ← {t("projects.backToProjects")}
        </Link>
      </div>
    );
  }

  const status  = STATUS_MAP[project.status] ?? STATUS_MAP.ARCHIVED;
  const gallery = project.gallery ?? [];

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label={t("common.close")}
          >
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <img
            src={lightbox}
            alt={t("projects.gallery")}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Geri dön */}
        <Link
          to={`/${lang}/projects`}
          className="inline-flex items-center gap-1.5 text-[13px] text-on-surface-variant hover:text-primary transition-colors mb-8 group"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          {t("projects.backToProjects")}
        </Link>

        {/* Hero görseli */}
        {project.thumbnail ? (
          <div className="w-full h-[340px] rounded-2xl overflow-hidden border border-outline-variant mb-10">
            <img
              src={project.thumbnail.file_url}
              alt={project.thumbnail.alt_text || project.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-[200px] rounded-2xl bg-gradient-to-br from-surface-container to-surface-variant flex items-center justify-center mb-10 border border-outline-variant">
            <span className="material-symbols-outlined text-[64px] text-outline">work</span>
          </div>
        )}

        {/* İki kolonlu layout */}
        <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-12">

          {/* ── Sol: ana içerik ── */}
          <div className="min-w-0">

            {/* Başlık + durum */}
            <div className="flex flex-wrap items-start gap-3 mb-4">
              <h1 className="text-[36px] sm:text-[42px] font-bold text-on-surface tracking-[-0.02em] leading-tight flex-1">
                {project.title}
              </h1>
              <span
                className="text-[13px] font-semibold px-3 py-1 rounded-full border mt-2 shrink-0"
                style={{
                  backgroundColor: `${status.color}15`,
                  color: status.color,
                  borderColor: `${status.color}30`,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {t(status.labelKey)}
              </span>
            </div>

            {/* Açıklama */}
            <p className="text-[16px] text-on-surface-variant leading-relaxed mb-8">
              {project.description}
            </p>

            {/* Teknolojiler */}
            {project.tech_stack.length > 0 && (
              <div className="mb-10">
                <h2 className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-[0.06em] mb-3"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {t("projects.techStack")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((t) => (
                    <span
                      key={t}
                      className="text-[13px] bg-surface-container text-on-surface-variant px-3 py-1 rounded-full border border-outline-variant"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Galeri */}
            {gallery.length > 0 && (
              <div className="mb-10">
                <h2 className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-[0.06em] mb-3"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {t("projects.gallery")}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gallery.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setLightbox(img.file_url)}
                      className="aspect-video rounded-xl overflow-hidden border border-outline-variant hover:border-primary/40 transition-all group"
                    >
                      <img
                        src={img.file_url}
                        alt={img.alt_text || project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sağ: meta bilgiler ── */}
          <aside className="mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Linkler */}
              {(project.github_url || project.live_url) && (
                <div className="space-y-2">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-high hover:border-primary/40 transition-all text-[14px] font-medium"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      {t("projects.viewCode")}
                    </a>
                  )}
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-on-primary hover:opacity-90 transition-opacity text-[14px] font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">launch</span>
                      {t("projects.viewLive")}
                    </a>
                  )}
                </div>
              )}

              {/* Tarihler */}
              {(project.start_date || project.end_date) && (
                <div className="bg-surface border border-outline-variant rounded-xl p-4 space-y-3">
                  {project.start_date && (
                    <div>
                      <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.06em] mb-0.5"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {t("projects.startDate")}
                      </p>
                      <p className="text-[14px] text-on-surface font-medium">
                        {formatDate(project.start_date, i18n.language)}
                      </p>
                    </div>
                  )}
                  {project.end_date && (
                    <div>
                      <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.06em] mb-0.5"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {t("projects.endDate")}
                      </p>
                      <p className="text-[14px] text-on-surface font-medium">
                        {formatDate(project.end_date, i18n.language)}
                      </p>
                    </div>
                  )}
                  {project.status === "IN_PROGRESS" && !project.end_date && (
                    <div className="flex items-center gap-1.5 text-[#f59e0b] text-[13px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                      {t("projects.activeDevelopment")}
                    </div>
                  )}
                </div>
              )}

              {/* Öne çıkan */}
              {project.is_featured && (
                <div className="flex items-center gap-2 text-[13px] text-yellow-500 bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  {t("projects.featuredProject")}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Diğer projeler */}
        {others.length > 0 && (
          <section className="mt-20 pt-12 border-t border-outline-variant">
            <h2 className="text-[20px] font-semibold text-on-surface mb-6">{t("projects.otherProjects")}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {others.map((p) => {
                const s = STATUS_MAP[p.status] ?? STATUS_MAP.ARCHIVED;
                return (
                  <Link
                    key={p.id}
                    to={`/${lang}/projects/${p.slug}`}
                    className="border border-outline-variant rounded-xl overflow-hidden bg-surface hover:border-primary/30 hover:bg-surface-container-low transition-all group block"
                  >
                    {p.thumbnail ? (
                      <img
                        src={p.thumbnail.file_url}
                        alt={p.thumbnail.alt_text || p.title}
                        className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-surface-container to-surface-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-[36px] text-outline">work</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[14px] font-semibold text-on-surface group-hover:text-primary transition-colors flex-1 truncate">
                          {p.title}
                        </h3>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: `${s.color}15`,
                            color: s.color,
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {t(s.labelKey)}
                        </span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </>
  );
}

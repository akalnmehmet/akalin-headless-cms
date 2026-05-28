import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { getProjects } from "../../api/projects";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { Project } from "../../types";

const STATUS_MAP: Record<string, { labelKey: string; cls: string }> = {
  ACTIVE:      { labelKey: "projects.status.ACTIVE",   cls: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20" },
  IN_PROGRESS: { labelKey: "projects.status.IN_PROGRESS", cls: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20" },
  ARCHIVED:    { labelKey: "projects.status.ARCHIVED",    cls: "bg-surface-container text-outline border-outline-variant" },
};

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { lang = "tr" } = useParams<{ lang: string }>();
  useDocumentMeta(t("projects.title") + " — Portföy", t("projects.description"));
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then((d) => setProjects(d.results))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse border border-outline-variant rounded-xl overflow-hidden bg-surface">
              <div className="h-44 bg-surface-variant" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-surface-variant rounded w-1/2" />
                <div className="h-4 bg-surface-variant rounded w-full" />
                <div className="h-4 bg-surface-variant rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-on-surface mb-2 tracking-tight">{t("projects.title")}</h1>
        <p className="text-on-surface-variant">{t("projects.description")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((project) => {
          const s = STATUS_MAP[project.status] ?? STATUS_MAP.ARCHIVED;
          return (
            <Link
              key={project.id}
              to={`/${lang}/projects/${project.slug}`}
              className="border border-outline-variant rounded-xl overflow-hidden bg-surface hover:border-primary/30 hover:bg-surface-container-low transition-all group block"
            >
              {project.thumbnail ? (
                <img
                  src={project.thumbnail.file_url}
                  alt={project.thumbnail.alt_text || project.title}
                  className="w-full h-44 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-surface-container to-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[48px] text-outline">work</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-on-surface group-hover:text-primary transition-colors">
                    {project.title}
                  </h2>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 border ${s.cls}`}
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {t(s.labelKey)}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mb-4 leading-relaxed line-clamp-3">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.tech_stack.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full border border-outline-variant"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 text-sm">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-on-surface-variant hover:text-on-surface font-medium flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      {t("projects.viewCode")}
                    </a>
                  )}
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:opacity-80 font-medium transition-opacity flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">launch</span>
                      {t("projects.viewLive")}
                    </a>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {projects.length === 0 && (
        <p className="text-on-surface-variant text-center py-12">{t("projects.noProjects")}</p>
      )}
    </div>
  );
}

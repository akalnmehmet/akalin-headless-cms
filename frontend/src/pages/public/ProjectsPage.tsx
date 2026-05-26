import { useEffect, useState } from "react";

import { getProjects } from "../../api/projects";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { Project } from "../../types";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE:      { label: "Tamamlandı",    cls: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "Devam ediyor",  cls: "bg-amber-100 text-amber-700" },
  ARCHIVED:    { label: "Arşiv",         cls: "bg-gray-100 text-gray-500"   },
};

export default function ProjectsPage() {
  useDocumentMeta("Projeler — Portföy", "Yazılım ve robotik projeleri.");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then((d) => setProjects(d.results))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-400">Yükleniyor...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Projeler</h1>
        <p className="text-gray-500">Robotik, web ve yazılım mühendisliği üzerine çalışmalarım.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((project) => {
          const s = STATUS_MAP[project.status] ?? STATUS_MAP.ARCHIVED;
          return (
            <article
              key={project.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
            >
              {project.thumbnail && (
                <img
                  src={project.thumbnail.file_url}
                  alt={project.thumbnail.alt_text || project.title}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">{project.title}</h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-3">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.tech_stack.map((t) => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
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
                      className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
                    >
                      ↗ GitHub
                    </a>
                  )}
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      → Demo
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

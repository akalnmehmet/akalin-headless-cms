import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { getCareer } from "../../api/career";
import { getPosts } from "../../api/posts";
import { getProjects } from "../../api/projects";
import { getSiteSettings } from "../../api/settings";
import CareerTimeline from "../../components/CareerTimeline";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { BlogPostList, CareerEntry, Project, SiteSettings } from "../../types";

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  owner_name: "Mehmet Akalın",
  owner_title: "Yazılım mühendisi",
  owner_bio: "ROS2, Django ve React ile robotikten web'e uzanan sistemler geliştiriyorum.",
  status_text: "Aktif geliştirme yapıyor",
  status_active: true,
  skills: ["Python", "Django", "React", "TypeScript", "ROS2", "SLAM", "Docker", "PostgreSQL", "C++"],
  github_url: "",
  linkedin_url: "",
  cv_url: "",
};

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { lang = "tr" } = useParams<{ lang: string }>();
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<BlogPostList[]>([]);
  const [career, setCareer] = useState<CareerEntry[]>([]);

  useDocumentMeta(
    `${siteSettings.owner_name} — Portföy`,
    `${siteSettings.owner_title} · ${siteSettings.owner_bio}`,
  );

  useEffect(() => {
    getSiteSettings().then(setSiteSettings).catch(() => {});
    getProjects().then((d) => setProjects(d.results.slice(0, 3)));
    getPosts({ page_size: "3", ordering: "-created_at" }).then((d) => setPosts(d.results));
    getCareer().then((d) => setCareer(d)).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-24">

      {/* Hero */}
      <section className="text-center space-y-6">
        {siteSettings.status_active && (
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-1.5 rounded-full font-medium border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            {siteSettings.status_text}
          </div>
        )}
        <h1 className="text-5xl font-bold text-on-surface leading-tight tracking-tight">
          {siteSettings.owner_name}
        </h1>
        <p className="text-xl text-on-surface-variant max-w-xl mx-auto leading-relaxed">
          {siteSettings.owner_title}
          {siteSettings.owner_bio && ` · ${siteSettings.owner_bio}`}
        </p>
        {siteSettings.skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {siteSettings.skills.map((s) => (
              <span
                key={s}
                className="bg-surface-container text-on-surface-variant text-sm px-3 py-1 rounded-full border border-outline-variant"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Öne çıkan projeler */}
      {projects.length > 0 && (
        <section>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-on-surface">{t("home.featuredProjects")}</h2>
            <Link to={`/${lang}/projects`} className="text-sm text-primary hover:opacity-80 transition-opacity">
              {t("home.viewAllProjects")} →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/${lang}/projects/${p.slug}`}
                className="border border-outline-variant rounded-xl p-5 bg-surface hover:border-primary/40 hover:bg-surface-container-low transition-all group block"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 font-medium border ${
                      p.status === "IN_PROGRESS"
                        ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
                        : "bg-tertiary/10 text-tertiary border-tertiary/20"
                    }`}
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {p.status === "IN_PROGRESS" ? t("projects.status.IN_PROGRESS") : t("projects.status.ACTIVE")}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mb-4 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.tech_stack.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 text-sm">
                  {p.github_url && (
                    <a
                      href={p.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
                    >
                      GitHub
                    </a>
                  )}
                  {p.live_url && (
                    <a
                      href={p.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:opacity-80 transition-opacity"
                    >
                      Demo
                    </a>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Kariyer özeti */}
      {career.length > 0 && (
        <section>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-on-surface">{t("nav.career")}</h2>
            <Link to={`/${lang}/career`} className="text-sm text-primary hover:opacity-80 transition-opacity">
              {t("nav.career")} →
            </Link>
          </div>
          <CareerTimeline entries={career} limit={3} />
        </section>
      )}

      {/* Son yazılar */}
      {posts.length > 0 && (
        <section>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-on-surface">{t("home.latestPosts")}</h2>
            <Link to={`/${lang}/blog`} className="text-sm text-primary hover:opacity-80 transition-opacity">
              {t("home.viewAllPosts")} →
            </Link>
          </div>
          <div className="space-y-5">
            {posts.map((post) => (
              <article
                key={post.id}
                className="flex gap-6 group border-b border-outline-variant pb-5 last:border-b-0"
              >
                <time
                  className="text-sm text-outline shrink-0 mt-0.5 w-24"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {new Date(post.created_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", {
                    day: "numeric", month: "short",
                  })}
                </time>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/${lang}/blog/${post.slug}`}
                    className="font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1"
                  >
                    {post.title}
                  </Link>
                  <p className="text-sm text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                    {post.summary}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${tag.color}18`,
                          color: tag.color,
                          borderColor: `${tag.color}33`,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="text-xs text-outline shrink-0 mt-0.5"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {t("blog.readingTime", { min: post.reading_time })}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

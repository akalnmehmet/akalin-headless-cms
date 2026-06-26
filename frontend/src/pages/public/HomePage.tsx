import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { GitBranch, ExternalLink, ArrowRight } from "lucide-react";

import { getCareer } from "../../api/career";
import { getPosts } from "../../api/posts";
import { getProjects } from "../../api/projects";
import { getSiteSettings } from "../../api/settings";
import CareerTimeline from "../../components/CareerTimeline";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { BlogPostList, CareerEntry, Project, SiteSettings } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
              <Badge
                key={s}
                variant="ghost"
                className="font-mono text-xs"
              >
                {s}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Öne çıkan projeler */}
      {projects.length > 0 && (
        <section>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-on-surface">{t("home.featuredProjects")}</h2>
            <Button variant="link" asChild className="text-primary p-0 h-auto">
              <Link to={`/${lang}/projects`}>
                {t("home.viewAllProjects")} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <Link key={p.id} to={`/${lang}/projects/${p.slug}`}>
                <Card className="h-full group border-outline-variant bg-surface hover:border-primary/40 hover:bg-surface-container-low cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {p.title}
                      </CardTitle>
                      <Badge
                        variant={p.status === "IN_PROGRESS" ? "warning" : "success"}
                        className="shrink-0 font-mono text-[10px]"
                      >
                        {p.status === "IN_PROGRESS" ? t("projects.status.IN_PROGRESS") : t("projects.status.ACTIVE")}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 leading-relaxed">
                      {p.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.tech_stack.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="ghost" className="font-mono text-[10px] px-1.5 py-0 rounded">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  {(p.github_url || p.live_url) && (
                    <CardFooter className="gap-3 pt-0">
                      {p.github_url && (
                        <a
                          href={p.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 text-sm transition-colors"
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                          GitHub
                        </a>
                      )}
                      {p.live_url && (
                        <a
                          href={p.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:opacity-80 transition-opacity flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Demo
                        </a>
                      )}
                    </CardFooter>
                  )}
                </Card>
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
            <Button variant="link" asChild className="text-primary p-0 h-auto">
              <Link to={`/${lang}/career`}>
                {t("nav.career")} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <CareerTimeline entries={career} limit={3} />
        </section>
      )}

      {/* Son yazılar */}
      {posts.length > 0 && (
        <section>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-on-surface">{t("home.latestPosts")}</h2>
            <Button variant="link" asChild className="text-primary p-0 h-auto">
              <Link to={`/${lang}/blog`}>
                {t("home.viewAllPosts")} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-0">
            {posts.map((post, idx) => (
              <article key={post.id}>
                <div className="flex gap-6 group py-5">
                  <time
                    className="text-sm text-outline shrink-0 mt-0.5 w-24 font-mono"
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
                          className="text-xs px-2 py-0.5 rounded-full border font-mono"
                          style={{
                            backgroundColor: `${tag.color}18`,
                            color: tag.color,
                            borderColor: `${tag.color}33`,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-outline shrink-0 mt-0.5 font-mono">
                    {t("blog.readingTime", { min: post.reading_time })}
                  </span>
                </div>
                {idx < posts.length - 1 && <Separator className="bg-outline-variant" />}
              </article>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

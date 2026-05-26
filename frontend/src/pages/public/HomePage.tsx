import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPosts } from "../../api/posts";
import { getProjects } from "../../api/projects";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import type { BlogPostList, Project } from "../../types";

const SKILLS = [
  "Python", "Django", "React", "TypeScript",
  "ROS2", "SLAM", "Docker", "PostgreSQL", "C++",
];

export default function HomePage() {
  useDocumentMeta("Mehmet Akalın — Portföy", "Yazılım mühendisi · ROS2, Django ve React ile robotikten web'e uzanan sistemler.");
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<BlogPostList[]>([]);

  useEffect(() => {
    getProjects().then((d) => setProjects(d.results.slice(0, 3)));
    getPosts({ page_size: "3", ordering: "-created_at" }).then((d) => setPosts(d.results));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-24">

      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-4 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Aktif geliştirme yapıyor
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight">
          Mehmet Akalın
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
          Yazılım mühendisi · ROS2, Django ve React ile robotikten web'e uzanan sistemler geliştiriyorum.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/projects"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Projeler
          </Link>
          <Link
            to="/blog"
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Blog
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {SKILLS.map((s) => (
            <span key={s} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Öne çıkan projeler */}
      {projects.length > 0 && (
        <section>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Projeler</h2>
            <Link to="/projects" className="text-sm text-blue-600 hover:underline">
              Tümünü gör →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <article
                key={p.id}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {p.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    p.status === "IN_PROGRESS"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {p.status === "IN_PROGRESS" ? "Devam ediyor" : "Tamamlandı"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.tech_stack.slice(0, 4).map((t) => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 text-sm">
                  {p.github_url && (
                    <a href={p.github_url} target="_blank" rel="noopener noreferrer"
                       className="text-gray-500 hover:text-gray-900 flex items-center gap-1">
                      GitHub
                    </a>
                  )}
                  {p.live_url && (
                    <a href={p.live_url} target="_blank" rel="noopener noreferrer"
                       className="text-blue-600 hover:underline">
                      Demo
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Son yazılar */}
      {posts.length > 0 && (
        <section>
          <div className="flex justify-between items-baseline mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Son Yazılar</h2>
            <Link to="/blog" className="text-sm text-blue-600 hover:underline">
              Tümünü gör →
            </Link>
          </div>
          <div className="space-y-5">
            {posts.map((post) => (
              <article key={post.id} className="flex gap-6 group">
                <time className="text-sm text-gray-400 shrink-0 mt-0.5 w-24">
                  {new Date(post.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric", month: "short",
                  })}
                </time>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    {post.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.summary}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                  {post.reading_time} dk
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

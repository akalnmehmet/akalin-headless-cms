import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import { deletePost, getAdminPosts, patchPost } from "../../api/posts";
import { deleteProject, getAdminProjects, patchProject, reorderProjects } from "../../api/projects";
import AdminSideNav from "../../components/AdminSideNav";
import { useAuthStore } from "../../store/authStore";
import type { BlogPostAdmin, Project } from "../../types";
import ProjectForm from "./ProjectForm";

const GrapesEditor = lazy(() => import("./GrapesEditor"));

type Section  = "posts" | "projects";
type PostTab  = "list" | "new" | "edit";
type ProjTab  = "list" | "new" | "edit";

const POST_STATUS: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: "Yayında",  cls: "bg-green-100 text-green-700"  },
  DRAFT:     { label: "Taslak",   cls: "bg-amber-100 text-amber-700"  },
  ARCHIVED:  { label: "Arşiv",    cls: "bg-gray-100  text-gray-500"   },
};

const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE:      { label: "Tamamlandı",   cls: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "Devam ediyor", cls: "bg-amber-100 text-amber-700" },
  ARCHIVED:    { label: "Arşiv",        cls: "bg-gray-100  text-gray-500"  },
};

// ── Tablo satır aksiyonları için paylaşımlı buton ──────────────────────────
const ActionBtn = ({
  onClick, danger, children,
}: { onClick: () => void; danger?: boolean; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`text-[12px] font-medium transition-colors duration-150 ${
      danger
        ? "text-error hover:opacity-80"
        : "text-primary hover:opacity-80"
    }`}
  >
    {children}
  </button>
);

export default function AdminDashboard() {
  const { refreshToken, clearTokens } = useAuthStore();
  const navigate = useNavigate();

  /* ── Bölüm & sekme durumu ── */
  const [section,    setSection]    = useState<Section>("posts");
  const [postTab,    setPostTab]    = useState<PostTab>("list");
  const [projTab,    setProjTab]    = useState<ProjTab>("list");
  const [editingPost,    setEditingPost]    = useState<BlogPostAdmin | undefined>();
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  /* ── Veri ── */
  const [posts,           setPosts]           = useState<BlogPostAdmin[]>([]);
  const [postCount,       setPostCount]       = useState(0);
  const [postsLoading,    setPostsLoading]    = useState(true);
  const [projects,        setProjects]        = useState<Project[]>([]);
  const [projectCount,    setProjectCount]    = useState(0);
  const [projectsLoading, setProjectsLoading] = useState(true);

  /* ── Veri yükleme ── */
  const loadPosts = useCallback(() => {
    setPostsLoading(true);
    getAdminPosts({ page_size: "50", ordering: "-created_at" })
      .then((d) => { setPosts(d.results); setPostCount(d.count); })
      .finally(() => setPostsLoading(false));
  }, []);

  const loadProjects = useCallback(() => {
    setProjectsLoading(true);
    getAdminProjects({ page_size: "50", ordering: "sort_order" })
      .then((d) => { setProjects(d.results); setProjectCount(d.count); })
      .finally(() => setProjectsLoading(false));
  }, []);

  useEffect(() => { loadPosts(); },    [loadPosts]);
  useEffect(() => { loadProjects(); }, [loadProjects]);

  /* ── Post aksiyonları ── */
  const handlePostStatusToggle = async (p: BlogPostAdmin) => {
    await patchPost(p.id, { status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" });
    loadPosts();
  };
  const handlePostDelete = async (p: BlogPostAdmin) => {
    if (!confirm(`"${p.title}" arşivlensin mi?`)) return;
    await deletePost(p.id);
    loadPosts();
  };
  const handlePostEdit = (p: BlogPostAdmin) => { setEditingPost(p);  setPostTab("edit"); };
  const handlePostSaved = () => { setPostTab("list"); setEditingPost(undefined); loadPosts(); };
  const handleNewPost   = () => { setEditingPost(undefined); setPostTab("new"); };
  const handleClosePost = () => { setPostTab("list"); setEditingPost(undefined); };

  /* ── Project aksiyonları ── */
  const handleProjStatusToggle = async (p: Project) => {
    await patchProject(p.id, { status: p.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" });
    loadProjects();
  };
  const handleProjDelete = async (p: Project) => {
    if (!confirm(`"${p.title}" arşivlensin mi?`)) return;
    await deleteProject(p.id);
    loadProjects();
  };
  const handleProjEdit   = (p: Project) => { setEditingProject(p); setProjTab("edit"); };
  const handleProjSaved  = () => { setProjTab("list"); setEditingProject(undefined); loadProjects(); };
  const handleNewProject = () => { setEditingProject(undefined); setProjTab("new"); };
  const handleCloseProj  = () => { setProjTab("list"); setEditingProject(undefined); };

  const handleProjectMove = async (index: number, dir: "up" | "down") => {
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= projects.length) return;
    const updated = [...projects];
    const aO = updated[index].sort_order;
    const bO = updated[target].sort_order;
    const newA = aO === bO ? (dir === "up" ? bO - 1 : bO + 1) : bO;
    const newB = aO === bO ? aO : aO;
    await reorderProjects([
      { id: updated[index].id, sort_order: newA },
      { id: updated[target].id, sort_order: newB },
    ]);
    loadProjects();
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    if (refreshToken) { try { await logout(refreshToken); } catch {} }
    clearTokens();
    navigate("/admin/login");
  };

  /* ── Sidebar aksiyonları ── */
  const handleNewItem = () => {
    if (section === "posts")    handleNewPost();
    else                        handleNewProject();
  };

  const handleSectionChange = (s: Section) => {
    setSection(s);
    setPostTab("list");
    setProjTab("list");
    setEditingPost(undefined);
    setEditingProject(undefined);
  };

  /* ── Editör açık mı? ── */
  const editorOpen =
    (section === "posts"    && (postTab === "new" || postTab === "edit")) ||
    (section === "projects" && (projTab === "new" || projTab === "edit"));

  /* ── Render ── */
  return (
    <div className="flex h-screen overflow-hidden bg-surface-container-lowest text-on-surface antialiased">

      {/* Sidebar */}
      <AdminSideNav
        section={section}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
      />

      {/* Ana içerik */}
      <main className="md:ml-64 flex-1 flex flex-col h-screen overflow-hidden">

        {/* ═══ YAZI LİSTESİ ═══ */}
        {section === "posts" && postTab === "list" && (
          <>
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                Blog Yazıları
                <span
                  className="ml-2 text-[12px] font-medium text-on-surface-variant align-middle"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  ({postCount})
                </span>
              </h1>
              <button
                onClick={handleNewPost}
                className="bg-primary text-on-primary text-[14px] font-medium px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition-opacity duration-150"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Yeni Yazı
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
                {postsLoading ? (
                  <div className="p-12 text-center text-on-surface-variant text-[14px]">Yükleniyor...</div>
                ) : posts.length === 0 ? (
                  <div className="p-12 text-center text-on-surface-variant text-[14px]">
                    Henüz yazı yok.{" "}
                    <button onClick={handleNewPost} className="text-primary hover:underline">
                      İlk yazıyı oluştur →
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-[14px]">
                    <thead className="bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="text-left px-6 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Başlık</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Durum</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Okuma</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Tarih</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {posts.map((post) => {
                        const s = POST_STATUS[post.status];
                        return (
                          <tr key={post.id} className="hover:bg-surface-container-low transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="font-medium text-on-surface line-clamp-1">{post.title}</div>
                              <div
                                className="text-on-surface-variant text-[12px] mt-0.5"
                                style={{ fontFamily: "JetBrains Mono, monospace" }}
                              >
                                /blog/{post.slug}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => handlePostStatusToggle(post)}
                                title="Tıkla: Yayın durumunu değiştir"
                                className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${s.cls} hover:opacity-80 transition-opacity`}
                              >
                                {s.label}
                              </button>
                            </td>
                            <td
                              className="px-4 py-4 text-on-surface-variant"
                              style={{ fontFamily: "JetBrains Mono, monospace" }}
                            >
                              {post.reading_time} dk
                            </td>
                            <td
                              className="px-4 py-4 text-on-surface-variant"
                              style={{ fontFamily: "JetBrains Mono, monospace" }}
                            >
                              {new Date(post.created_at).toLocaleDateString("tr-TR")}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-4 justify-end">
                                <ActionBtn onClick={() => handlePostEdit(post)}>Düzenle</ActionBtn>
                                <ActionBtn onClick={() => handlePostDelete(post)} danger>Arşivle</ActionBtn>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══ YAZI EDİTÖRÜ ═══ */}
        {section === "posts" && (postTab === "new" || postTab === "edit") && (
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center text-on-surface-variant text-[14px]">
              Editör yükleniyor...
            </div>
          }>
            <GrapesEditor
              post={editingPost}
              onSaved={handlePostSaved}
              onClose={handleClosePost}
            />
          </Suspense>
        )}

        {/* ═══ PROJE LİSTESİ ═══ */}
        {section === "projects" && projTab === "list" && (
          <>
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                Projeler
                <span
                  className="ml-2 text-[12px] font-medium text-on-surface-variant align-middle"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  ({projectCount})
                </span>
              </h1>
              <button
                onClick={handleNewProject}
                className="bg-primary text-on-primary text-[14px] font-medium px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition-opacity duration-150"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Yeni Proje
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
                {projectsLoading ? (
                  <div className="p-12 text-center text-on-surface-variant text-[14px]">Yükleniyor...</div>
                ) : projects.length === 0 ? (
                  <div className="p-12 text-center text-on-surface-variant text-[14px]">
                    Henüz proje yok.{" "}
                    <button onClick={handleNewProject} className="text-primary hover:underline">
                      İlk projeyi oluştur →
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-[14px]">
                    <thead className="bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="text-left px-6 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Proje</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Durum</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Teknolojiler</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Sıra</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>★</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {projects.map((proj, idx) => {
                        const s = PROJECT_STATUS[proj.status];
                        return (
                          <tr key={proj.id} className="hover:bg-surface-container-low transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="font-medium text-on-surface">{proj.title}</div>
                              <div className="text-on-surface-variant text-[12px] mt-0.5 line-clamp-1">{proj.description}</div>
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => handleProjStatusToggle(proj)}
                                title="Tıkla: Durumu değiştir"
                                className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${s.cls} hover:opacity-80 transition-opacity`}
                              >
                                {s.label}
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {proj.tech_stack.slice(0, 3).map((t) => (
                                  <span key={t} className="text-[11px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded border border-outline-variant">
                                    {t}
                                  </span>
                                ))}
                                {proj.tech_stack.length > 3 && (
                                  <span className="text-[11px] text-on-surface-variant">+{proj.tech_stack.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleProjectMove(idx, "up")}
                                  disabled={idx === 0}
                                  className="text-on-surface-variant hover:text-on-surface disabled:opacity-20 disabled:cursor-not-allowed text-[13px] leading-none transition-colors"
                                >▲</button>
                                <span
                                  className="text-[12px] text-on-surface-variant w-5 text-center"
                                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                                >
                                  {proj.sort_order}
                                </span>
                                <button
                                  onClick={() => handleProjectMove(idx, "down")}
                                  disabled={idx === projects.length - 1}
                                  className="text-on-surface-variant hover:text-on-surface disabled:opacity-20 disabled:cursor-not-allowed text-[13px] leading-none transition-colors"
                                >▼</button>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {proj.is_featured
                                ? <span className="text-yellow-500">★</span>
                                : <span className="text-outline">☆</span>}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-4 justify-end">
                                <ActionBtn onClick={() => handleProjEdit(proj)}>Düzenle</ActionBtn>
                                <ActionBtn onClick={() => handleProjDelete(proj)} danger>Arşivle</ActionBtn>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══ PROJE FORMU ═══ */}
        {section === "projects" && (projTab === "new" || projTab === "edit") && (
          <div className="flex flex-col h-full">
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                {projTab === "edit" ? "Projeyi Düzenle" : "Yeni Proje"}
              </h1>
              <button
                onClick={handleCloseProj}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                aria-label="Kapat"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto">
              <ProjectForm
                project={editingProject}
                onSaved={handleProjSaved}
                onCancel={handleCloseProj}
              />
            </div>
          </div>
        )}

        {/* Hiçbir şey yokken (mantıksal olarak ulaşılmaz ama güvenlik için) */}
        {!editorOpen && section === "posts" && postTab !== "list" && null}

      </main>
    </div>
  );
}

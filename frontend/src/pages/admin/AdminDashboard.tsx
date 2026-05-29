import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import { deleteCareerEntry, getCareer } from "../../api/career";
import { bulkDeletePosts, bulkPatchPosts, deletePost, getAdminPosts, patchPost } from "../../api/posts";
import { totpDisable, totpSetupConfirm, totpSetupGet, totpStatus } from "../../api/auth";
import { deleteProject, getAdminProjects, patchProject, reorderProjects } from "../../api/projects";
import { approveComment, deleteComment, getAdminComments, rejectComment } from "../../api/comments";
import { deleteSubscriber, getSubscribers, sendTestEmail } from "../../api/newsletter";
import AdminSideNav from "../../components/AdminSideNav";
import PostCalendar from "../../components/PostCalendar";
import SortableList from "../../components/SortableList";
import { useAuthStore } from "../../store/authStore";
import type { BlogPostAdmin, CareerEntry, Project } from "../../types";
import type { AdminComment } from "../../api/comments";
import type { Subscriber } from "../../api/newsletter";
import AnalyticsDashboard from "./AnalyticsDashboard";
import CareerForm from "./CareerForm";
import MediaLibrary from "./MediaLibrary";
import ProjectForm from "./ProjectForm";
import SiteSettingsForm from "./SiteSettingsForm";

const GrapesEditor = lazy(() => import("./GrapesEditor"));

type Section =
  | "dashboard" | "posts" | "projects" | "career"
  | "media" | "settings" | "analytics" | "comments"
  | "newsletter" | "calendar" | "security";
type PostTab  = "list" | "new" | "edit";
type ProjTab  = "list" | "new" | "edit";
type CareerTab = "list" | "new" | "edit";

const POST_STATUS: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: "Yayında", cls: "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20" },
  DRAFT:     { label: "Taslak",  cls: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20" },
  ARCHIVED:  { label: "Arşiv",   cls: "bg-surface-container text-outline border border-outline-variant" },
};

const PROJECT_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE:      { label: "Tamamlandı",   cls: "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20" },
  IN_PROGRESS: { label: "Devam ediyor", cls: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20" },
  ARCHIVED:    { label: "Arşiv",        cls: "bg-surface-container text-outline border border-outline-variant" },
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

  /* ── Mobil drawer ── */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* ── Bölüm & sekme durumu ── */
  const [section,    setSection]    = useState<Section>("dashboard");
  const [postTab,    setPostTab]    = useState<PostTab>("list");
  const [projTab,    setProjTab]    = useState<ProjTab>("list");
  const [careerTab,  setCareerTab]  = useState<CareerTab>("list");
  const [editingPost,    setEditingPost]    = useState<BlogPostAdmin | undefined>();
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [editingCareer,  setEditingCareer]  = useState<CareerEntry | undefined>();

  /* ── Veri ── */
  const [posts,           setPosts]           = useState<BlogPostAdmin[]>([]);
  const [postCount,       setPostCount]       = useState(0);
  const [postsLoading,    setPostsLoading]    = useState(true);
  const [projects,        setProjects]        = useState<Project[]>([]);
  const [projectCount,    setProjectCount]    = useState(0);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [careerEntries,   setCareerEntries]   = useState<CareerEntry[]>([]);
  const [careerLoading,   setCareerLoading]   = useState(true);
  const [comments,        setComments]        = useState<AdminComment[]>([]);
  const [commentCount,    setCommentCount]    = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentFilter,   setCommentFilter]   = useState<"pending" | "approved" | "all">("pending");

  /* ── Newsletter ── */
  const [subscribers,       setSubscribers]       = useState<Subscriber[]>([]);
  const [subsLoading,       setSubsLoading]       = useState(false);
  const [testEmail,         setTestEmail]         = useState("");
  const [testEmailStatus,   setTestEmailStatus]   = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [testEmailMsg,      setTestEmailMsg]       = useState("");

  /* ── Toplu aksiyonlar ── */
  const [selectedPostIds,   setSelectedPostIds]   = useState<Set<string>>(new Set());
  const [bulkWorking,       setBulkWorking]       = useState(false);

  /* ── 2FA / Güvenlik ── */
  const [totpActive,        setTotpActive]        = useState<boolean | null>(null);
  const [totpQr,            setTotpQr]            = useState<string>("");
  const [totpSecret,        setTotpSecret]        = useState<string>("");
  const [totpSetupCode,     setTotpSetupCode]     = useState("");
  const [totpDisableCode,   setTotpDisableCode]   = useState("");
  const [totpMsg,           setTotpMsg]           = useState<{ text: string; ok: boolean } | null>(null);
  const [totpWorking,       setTotpWorking]       = useState(false);

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

  const loadCareer = useCallback(() => {
    setCareerLoading(true);
    getCareer()
      .then(setCareerEntries)
      .finally(() => setCareerLoading(false));
  }, []);

  const loadComments = useCallback((filter: "pending" | "approved" | "all") => {
    setCommentsLoading(true);
    const params: Record<string, string> = {};
    if (filter === "pending")  params.is_approved = "false";
    if (filter === "approved") params.is_approved = "true";
    getAdminComments(params)
      .then((d) => { setComments(d.results); setCommentCount(d.count); })
      .finally(() => setCommentsLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPosts(); },    [loadPosts]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadProjects(); }, [loadProjects]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadCareer(); },   [loadCareer]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (section === "comments") loadComments(commentFilter); }, [section, commentFilter, loadComments]);

  /* ── Newsletter yükleme ── */
  const loadSubscribers = useCallback(() => {
    setSubsLoading(true);
    getSubscribers()
      .then((d) => setSubscribers(d.results))
      .finally(() => setSubsLoading(false));
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (section === "newsletter") loadSubscribers(); }, [section, loadSubscribers]);

  /* ── 2FA durum yükleme ── */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (section !== "security") return;
    totpStatus().then((r) => setTotpActive(r.is_active)).catch(() => setTotpActive(false));
  }, [section]);

  const handleTotpSetupStart = async () => {
    setTotpWorking(true);
    setTotpMsg(null);
    try {
      const r = await totpSetupGet();
      if (r.is_active) { setTotpActive(true); return; }
      setTotpQr(r.qr_image ?? "");
      setTotpSecret(r.secret ?? "");
    } catch { setTotpMsg({ text: "QR kodu alınamadı.", ok: false }); }
    finally { setTotpWorking(false); }
  };

  const handleTotpActivate = async () => {
    if (!totpSetupCode.trim()) return;
    setTotpWorking(true);
    setTotpMsg(null);
    try {
      const r = await totpSetupConfirm(totpSetupCode);
      setTotpMsg({ text: r.detail, ok: true });
      setTotpActive(true);
      setTotpQr(""); setTotpSecret(""); setTotpSetupCode("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Hata oluştu.";
      setTotpMsg({ text: msg, ok: false });
    } finally { setTotpWorking(false); }
  };

  const handleTotpDisable = async () => {
    if (!totpDisableCode.trim()) return;
    setTotpWorking(true);
    setTotpMsg(null);
    try {
      const r = await totpDisable(totpDisableCode);
      setTotpMsg({ text: r.detail, ok: true });
      setTotpActive(false);
      setTotpDisableCode("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Hata oluştu.";
      setTotpMsg({ text: msg, ok: false });
    } finally { setTotpWorking(false); }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) return;
    setTestEmailStatus("sending");
    try {
      const r = await sendTestEmail(testEmail.trim());
      setTestEmailMsg(r.detail);
      setTestEmailStatus("ok");
    } catch {
      setTestEmailMsg("Gönderim başarısız. E-posta veya SMTP ayarlarını kontrol edin.");
      setTestEmailStatus("err");
    }
    setTimeout(() => setTestEmailStatus("idle"), 5000);
  };

  /* ── Toplu aksiyonlar ── */
  const toggleSelectPost = (id: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedPostIds((prev) =>
      prev.size === posts.length ? new Set() : new Set(posts.map((p) => p.id))
    );
  };
  const handleBulkPublish = async () => {
    if (!selectedPostIds.size) return;
    setBulkWorking(true);
    await bulkPatchPosts([...selectedPostIds], { status: "PUBLISHED" });
    setSelectedPostIds(new Set());
    setBulkWorking(false);
    loadPosts();
  };
  const handleBulkArchive = async () => {
    if (!selectedPostIds.size) return;
    setBulkWorking(true);
    await bulkPatchPosts([...selectedPostIds], { status: "ARCHIVED" });
    setSelectedPostIds(new Set());
    setBulkWorking(false);
    loadPosts();
  };
  const handleBulkDelete = async () => {
    if (!selectedPostIds.size) return;
    if (!confirm(`${selectedPostIds.size} yazı kalıcı olarak silinsin mi?`)) return;
    setBulkWorking(true);
    await bulkDeletePosts([...selectedPostIds]);
    setSelectedPostIds(new Set());
    setBulkWorking(false);
    loadPosts();
  };

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

  const handleProjectReorder = async (reordered: Project[]) => {
    // Önce UI'ı anında güncelle
    setProjects(reordered);
    // Sonra her projenin yeni sort_order'ını kaydet
    await reorderProjects(
      reordered.map((p, idx) => ({ id: p.id, sort_order: idx }))
    );
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    if (refreshToken) { try { await logout(refreshToken); } catch { /* blacklist hatası yoksay */ } }
    clearTokens();
    navigate("/admin/login");
  };

  /* ── Career aksiyonları ── */
  const handleCareerEdit   = (e: CareerEntry) => { setEditingCareer(e); setCareerTab("edit"); };
  const handleCareerSaved  = () => { setCareerTab("list"); setEditingCareer(undefined); loadCareer(); };
  const handleNewCareer    = () => { setEditingCareer(undefined); setCareerTab("new"); };
  const handleCloseCareer  = () => { setCareerTab("list"); setEditingCareer(undefined); };
  const handleCareerDelete = async (e: CareerEntry) => {
    if (!confirm(`"${e.position} @ ${e.company}" silinsin mi?`)) return;
    await deleteCareerEntry(e.id);
    loadCareer();
  };

  const handleSectionChange = (s: Section) => {
    setSection(s);
    setPostTab("list");
    setProjTab("list");
    setCareerTab("list");
    setEditingPost(undefined);
    setEditingProject(undefined);
    setEditingCareer(undefined);
    setSelectedPostIds(new Set());
  };

  const TYPE_LABEL: Record<string, string> = {
    WORK: "İş", EDUCATION: "Eğitim", VOLUNTEER: "Gönüllülük",
  };

  /* ── Editör açık mı? ── */
  const editorOpen =
    (section === "posts"    && (postTab === "new" || postTab === "edit")) ||
    (section === "projects" && (projTab === "new" || projTab === "edit"));

  /* ── Render ── */
  return (
    <div className="flex h-screen overflow-hidden text-on-surface antialiased">

      {/* Sidebar */}
      <AdminSideNav
        section={section}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Ana içerik */}
      <main className="md:ml-64 flex-1 flex flex-col h-screen overflow-hidden">

        {/* ── Mobil header ── */}
        <div className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-outline-variant bg-surface shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Menüyü aç"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <span className="text-[16px] font-semibold text-on-surface">CMS Paneli</span>
        </div>

        {/* ═══ DASHBOARD ═══ */}
        {section === "dashboard" && (() => {
          const published  = posts.filter((p) => p.status === "PUBLISHED").length;
          const draft      = posts.filter((p) => p.status === "DRAFT").length;
          const archived   = posts.filter((p) => p.status === "ARCHIVED").length;
          const totalViews = posts.reduce((s, p) => s + (p.view_count ?? 0), 0);

          const StatCard = ({
            icon, label, value, sub, color,
          }: {
            icon: string; label: string; value: number | string;
            sub?: string; color?: string;
          }) => (
            <div className="bg-surface border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-on-surface-variant">{label}</span>
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ color: color ?? "var(--color-primary)" }}
                >
                  {icon}
                </span>
              </div>
              <div>
                <span
                  className="text-[32px] font-bold text-on-surface leading-none"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {value}
                </span>
                {sub && (
                  <p className="text-[11px] text-on-surface-variant mt-1">{sub}</p>
                )}
              </div>
            </div>
          );

          return (
            <>
              <header className="h-16 border-b border-outline-variant bg-surface flex items-center px-6 shrink-0">
                <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                  Dashboard
                </h1>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Ana istatistikler */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon="article"    label="Toplam Yazı"       value={postCount}            sub={`${published} yayında · ${draft} taslak`} />
                  <StatCard icon="visibility" label="Toplam Görüntülenme" value={totalViews.toLocaleString("tr-TR")} sub="Tüm yazılar toplamı" color="#00d4ff" />
                  <StatCard icon="work"       label="Projeler"          value={projectCount}          color="#7c3aed" />
                  <StatCard icon="timeline"   label="Kariyer Kaydı"     value={careerEntries.length}  color="#10b981" />
                </div>

                {/* Yazı durum dağılımı */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-[#10b981]">check_circle</span>
                    </div>
                    <div>
                      <p className="text-[24px] font-bold text-on-surface leading-none" style={{ fontFamily: "JetBrains Mono, monospace" }}>{published}</p>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">Yayında</p>
                    </div>
                  </div>
                  <div className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-[#f59e0b]">edit_note</span>
                    </div>
                    <div>
                      <p className="text-[24px] font-bold text-on-surface leading-none" style={{ fontFamily: "JetBrains Mono, monospace" }}>{draft}</p>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">Taslak</p>
                    </div>
                  </div>
                  <div className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-outline">inventory_2</span>
                    </div>
                    <div>
                      <p className="text-[24px] font-bold text-on-surface leading-none" style={{ fontFamily: "JetBrains Mono, monospace" }}>{archived}</p>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">Arşivde</p>
                    </div>
                  </div>
                </div>

                {/* En çok okunan yazılar — yatay bar grafik */}
                {posts.length > 0 && (() => {
                  const topPosts = [...posts]
                    .sort((a, b) => b.view_count - a.view_count)
                    .slice(0, 8);
                  const maxViews = topPosts[0]?.view_count ?? 0;

                  return (
                    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant">
                        <h2 className="text-[14px] font-semibold text-on-surface">En Çok Okunan Yazılar</h2>
                        <span
                          className="text-[11px] text-on-surface-variant"
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          view_count
                        </span>
                      </div>
                      <div className="p-5 space-y-3">
                        {maxViews === 0 ? (
                          <p className="text-center text-[13px] text-on-surface-variant py-4">
                            Henüz görüntülenme verisi yok.
                          </p>
                        ) : (
                          topPosts.map((p, i) => {
                            const pct = (p.view_count / maxViews) * 100;
                            return (
                              <div key={p.id} className="flex items-center gap-3">
                                <span
                                  className="text-[11px] text-outline w-4 shrink-0 text-right"
                                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                                >
                                  {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[13px] text-on-surface font-medium truncate pr-3">
                                      {p.title}
                                    </span>
                                    <span
                                      className="text-[12px] text-primary shrink-0"
                                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                                    >
                                      {p.view_count.toLocaleString("tr-TR")}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${pct}%`,
                                        background: "linear-gradient(90deg, var(--color-primary), #00d4ff)",
                                        transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Son yazılar */}
                {posts.length > 0 && (
                  <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant">
                      <h2 className="text-[14px] font-semibold text-on-surface">Son Yazılar</h2>
                      <button
                        onClick={() => setSection("posts")}
                        className="text-[12px] text-primary hover:opacity-80 transition-opacity"
                      >
                        Tümünü gör →
                      </button>
                    </div>
                    <div className="divide-y divide-outline-variant/40">
                      {posts.slice(0, 6).map((p) => {
                        const s = POST_STATUS[p.status];
                        return (
                          <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low transition-colors">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${s.cls}`}
                              style={{ fontFamily: "JetBrains Mono, monospace" }}>
                              {s.label}
                            </span>
                            <span className="flex-1 text-[13px] text-on-surface font-medium truncate">{p.title}</span>
                            <span className="text-[11px] text-outline shrink-0 flex items-center gap-1"
                              style={{ fontFamily: "JetBrains Mono, monospace" }}>
                              <span className="material-symbols-outlined text-[13px]">visibility</span>
                              {p.view_count.toLocaleString("tr-TR")}
                            </span>
                            <span className="text-[11px] text-outline shrink-0"
                              style={{ fontFamily: "JetBrains Mono, monospace" }}>
                              {new Date(p.created_at).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </>
          );
        })()}

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

            <div className="flex-1 overflow-y-auto p-6 relative">
              {/* Toplu aksiyon çubuğu */}
              {selectedPostIds.size > 0 && (
                <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-[13px] font-semibold text-primary">
                    {selectedPostIds.size} yazı seçili
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={handleBulkPublish}
                      disabled={bulkWorking}
                      className="px-3 py-1.5 rounded-lg bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 text-[12px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      Yayınla
                    </button>
                    <button
                      onClick={handleBulkArchive}
                      disabled={bulkWorking}
                      className="px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 text-[12px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      Arşivle
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkWorking}
                      className="px-3 py-1.5 rounded-lg bg-error/10 text-error border border-error/20 text-[12px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      Sil
                    </button>
                    <button
                      onClick={() => setSelectedPostIds(new Set())}
                      className="text-[12px] text-on-surface-variant hover:text-on-surface transition-colors ml-1"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}

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
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedPostIds.size === posts.length && posts.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 accent-primary cursor-pointer"
                            title="Tümünü seç"
                          />
                        </th>
                        <th className="text-left px-3 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Başlık</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>Durum</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase hidden sm:table-cell" style={{ fontFamily: "JetBrains Mono, monospace" }}>Okuma</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase hidden md:table-cell" style={{ fontFamily: "JetBrains Mono, monospace" }}>Görüntülenme</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase hidden lg:table-cell" style={{ fontFamily: "JetBrains Mono, monospace" }}>Tarih</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {posts.map((post) => {
                        const s = POST_STATUS[post.status];
                        const selected = selectedPostIds.has(post.id);
                        return (
                          <tr key={post.id} className={`transition-colors duration-150 ${selected ? "bg-primary/5" : "hover:bg-surface-container-low"}`}>
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelectPost(post.id)}
                                className="w-4 h-4 accent-primary cursor-pointer"
                              />
                            </td>
                            <td className="px-3 py-4">
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
                              className="px-4 py-4 text-on-surface-variant hidden sm:table-cell"
                              style={{ fontFamily: "JetBrains Mono, monospace" }}
                            >
                              {post.reading_time} dk
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span
                                className="inline-flex items-center gap-1 text-[12px] text-on-surface-variant"
                                style={{ fontFamily: "JetBrains Mono, monospace" }}
                              >
                                <span className="material-symbols-outlined text-[13px]">visibility</span>
                                {post.view_count.toLocaleString("tr-TR")}
                              </span>
                            </td>
                            <td
                              className="px-4 py-4 text-on-surface-variant hidden lg:table-cell"
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
              {projectsLoading ? (
                <div className="text-on-surface-variant text-[14px]">Yükleniyor...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant text-[14px]">
                  Henüz proje yok.{" "}
                  <button onClick={handleNewProject} className="text-primary hover:underline">
                    İlk projeyi oluştur →
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-on-surface-variant mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">drag_indicator</span>
                    Sıralamak için satırı sürükle
                  </p>
                  <SortableList
                    items={projects}
                    onReorder={handleProjectReorder}
                    renderItem={(proj, dragHandleProps) => {
                      const s = PROJECT_STATUS[proj.status];
                      return (
                        <div className="bg-surface border border-outline-variant rounded-xl flex items-center gap-3 px-4 py-3 hover:border-primary/30 transition-colors group">
                          {/* Sürükleme tutacağı */}
                          <span
                            {...dragHandleProps}
                            className="material-symbols-outlined text-[20px] text-outline cursor-grab active:cursor-grabbing hover:text-on-surface-variant transition-colors shrink-0 touch-none"
                          >
                            drag_indicator
                          </span>

                          {/* Proje bilgisi */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[14px] text-on-surface">{proj.title}</span>
                              {proj.is_featured && (
                                <span className="text-[11px] text-yellow-500">★</span>
                              )}
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.cls}`}
                                style={{ fontFamily: "JetBrains Mono, monospace" }}>
                                {s.label}
                              </span>
                            </div>
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {proj.tech_stack.slice(0, 4).map((t) => (
                                <span key={t} className="text-[11px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded border border-outline-variant"
                                  style={{ fontFamily: "JetBrains Mono, monospace" }}>
                                  {t}
                                </span>
                              ))}
                              {proj.tech_stack.length > 4 && (
                                <span className="text-[11px] text-on-surface-variant">+{proj.tech_stack.length - 4}</span>
                              )}
                            </div>
                          </div>

                          {/* Aksiyon butonları */}
                          <div className="flex items-center gap-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ActionBtn onClick={() => handleProjStatusToggle(proj)}>
                              {proj.status === "ACTIVE" ? "Arşivle" : "Yayınla"}
                            </ActionBtn>
                            <ActionBtn onClick={() => handleProjEdit(proj)}>Düzenle</ActionBtn>
                            <ActionBtn onClick={() => handleProjDelete(proj)} danger>Sil</ActionBtn>
                          </div>
                        </div>
                      );
                    }}
                    renderOverlay={(proj) => (
                      <div className="bg-surface border-2 border-primary/50 rounded-xl flex items-center gap-3 px-4 py-3 shadow-2xl">
                        <span className="material-symbols-outlined text-[20px] text-primary shrink-0">drag_indicator</span>
                        <span className="font-semibold text-[14px] text-on-surface">{proj.title}</span>
                      </div>
                    )}
                  />
                </>
              )}
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

        {/* ═══ KARİYER LİSTESİ ═══ */}
        {section === "career" && careerTab === "list" && (
          <>
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                Kariyer
                <span className="ml-2 text-[12px] font-medium text-on-surface-variant align-middle"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  ({careerEntries.length})
                </span>
              </h1>
              <button
                onClick={handleNewCareer}
                className="flex items-center gap-2 bg-primary text-on-primary text-[13px] font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Yeni Kayıt
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              {careerLoading ? (
                <div className="text-on-surface-variant text-[14px]">Yükleniyor...</div>
              ) : careerEntries.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">timeline</span>
                  Henüz kariyer kaydı yok.
                </div>
              ) : (
                <div className="space-y-3 max-w-3xl">
                  {careerEntries.map((entry) => {
                    const typeColor =
                      entry.entry_type === "WORK"      ? "#00d4ff" :
                      entry.entry_type === "EDUCATION" ? "#7c3aed" : "#10b981";
                    return (
                      <div
                        key={entry.id}
                        className="bg-surface border border-outline-variant rounded-xl p-4 flex items-start justify-between gap-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${typeColor}15`,
                                color: typeColor,
                                fontFamily: "JetBrains Mono, monospace",
                              }}
                            >
                              {TYPE_LABEL[entry.entry_type]}
                            </span>
                            {entry.is_current && (
                              <span
                                className="text-[11px] bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full font-medium"
                                style={{ fontFamily: "JetBrains Mono, monospace" }}
                              >
                                Devam Ediyor
                              </span>
                            )}
                          </div>
                          <p className="text-[15px] font-semibold text-on-surface">{entry.position}</p>
                          <p className="text-[13px] text-primary">{entry.company}</p>
                          {entry.location && (
                            <p className="text-[12px] text-on-surface-variant mt-0.5">{entry.location}</p>
                          )}
                          <p
                            className="text-[11px] text-outline mt-1"
                            style={{ fontFamily: "JetBrains Mono, monospace" }}
                          >
                            {entry.start_date} — {entry.is_current ? "devam ediyor" : (entry.end_date ?? "?")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <ActionBtn onClick={() => handleCareerEdit(entry)}>Düzenle</ActionBtn>
                          <ActionBtn onClick={() => handleCareerDelete(entry)} danger>Sil</ActionBtn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ KARİYER FORM ═══ */}
        {section === "career" && (careerTab === "new" || careerTab === "edit") && (
          <div className="flex flex-col h-full">
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                {careerTab === "edit" ? "Kaydı Düzenle" : "Yeni Kariyer Kaydı"}
              </h1>
              <button
                onClick={handleCloseCareer}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto">
              <CareerForm
                entry={editingCareer}
                onSaved={handleCareerSaved}
                onCancel={handleCloseCareer}
              />
            </div>
          </div>
        )}

        {/* ═══ MEDYA KÜTÜPHANESİ ═══ */}
        {section === "media" && <MediaLibrary />}

        {/* ═══ ANALİTİK ═══ */}
        {section === "analytics" && <AnalyticsDashboard />}

        {/* ═══ TAKVİM ═══ */}
        {section === "calendar" && (
          <>
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center px-6 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                Yazı Takvimi
              </h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <PostCalendar
                posts={posts}
                onEditPost={(p) => { setEditingPost(p); setPostTab("edit"); setSection("posts"); }}
              />
            </div>
          </>
        )}

        {/* ═══ YORUMLAR ═══ */}
        {section === "comments" && (
          <>
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center px-6 gap-4 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                Yorumlar
              </h1>
              {commentCount > 0 && (
                <span className="text-[12px] font-mono text-on-surface-variant">
                  {commentCount} kayıt
                </span>
              )}
              {/* Filtre */}
              <div className="ml-auto flex gap-1">
                {(["pending", "approved", "all"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setCommentFilter(f)}
                    className={`px-3 py-1 rounded-full text-[12px] font-mono border transition-colors ${
                      commentFilter === f
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "text-on-surface-variant border-outline-variant hover:bg-surface-container"
                    }`}
                  >
                    {f === "pending" ? "Bekleyen" : f === "approved" ? "Onaylı" : "Tümü"}
                  </button>
                ))}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              {commentsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className="h-16 bg-surface-variant rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] mb-3 opacity-30">chat_bubble</span>
                  <p className="text-[14px]">
                    {commentFilter === "pending" ? "Bekleyen yorum yok." : "Yorum bulunamadı."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-4"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-semibold text-on-surface">{c.name}</span>
                          <span className="text-[11px] text-outline font-mono">{c.email}</span>
                          {c.parent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                              yanıt
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ml-auto ${
                              c.is_approved
                                ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                                : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
                            }`}
                          >
                            {c.is_approved ? "Onaylı" : "Bekliyor"}
                          </span>
                        </div>
                        <p className="text-[12px] text-outline font-mono">
                          {c.post_title} · {new Date(c.created_at).toLocaleString("tr-TR")}
                        </p>
                        <p className="text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words">
                          {c.body}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!c.is_approved && (
                          <button
                            onClick={() => approveComment(c.id).then(() => loadComments(commentFilter))}
                            className="text-[12px] text-[#10b981] hover:opacity-80 font-medium transition-opacity"
                          >
                            Onayla
                          </button>
                        )}
                        {c.is_approved && (
                          <button
                            onClick={() => rejectComment(c.id).then(() => loadComments(commentFilter))}
                            className="text-[12px] text-[#f59e0b] hover:opacity-80 font-medium transition-opacity"
                          >
                            Geri Al
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!confirm("Bu yorum silinsin mi?")) return;
                            deleteComment(c.id).then(() => loadComments(commentFilter));
                          }}
                          className="text-[12px] text-error hover:opacity-80 font-medium transition-opacity"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ NEWSLETTER ═══ */}
        {section === "newsletter" && (
          <>
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center px-6 gap-4 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                Newsletter
              </h1>
              {!subsLoading && (
                <span className="text-[12px] font-mono text-on-surface-variant">
                  {subscribers.filter((s) => s.is_active).length} aktif /{" "}
                  {subscribers.length} toplam
                </span>
              )}
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Test e-posta gönder */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">send</span>
                  Test E-postası Gönder
                </h2>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@ornek.com"
                    className="flex-1 px-3 py-2 text-[13px] rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                  <button
                    onClick={handleTestEmail}
                    disabled={testEmailStatus === "sending" || !testEmail.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {testEmailStatus === "sending" ? (
                      <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[15px]">mail</span>
                    )}
                    Gönder
                  </button>
                </div>
                {testEmailStatus !== "idle" && testEmailStatus !== "sending" && (
                  <p className={`mt-2 text-[12px] font-mono ${testEmailStatus === "ok" ? "text-[#10b981]" : "text-error"}`}>
                    {testEmailMsg}
                  </p>
                )}
              </div>

              {/* Abone listesi */}
              <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant">
                  <h2 className="text-[14px] font-semibold text-on-surface">Abone Listesi</h2>
                  <button
                    onClick={loadSubscribers}
                    className="text-[12px] text-primary hover:opacity-80 transition-opacity flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    Yenile
                  </button>
                </div>
                {subsLoading ? (
                  <div className="p-8 text-center text-on-surface-variant text-[14px]">Yükleniyor...</div>
                ) : subscribers.length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant text-[14px]">Henüz abone yok.</div>
                ) : (
                  <table className="w-full text-[13px]">
                    <thead className="bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-[0.05em]" style={{ fontFamily: "JetBrains Mono, monospace" }}>E-posta</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-[0.05em]" style={{ fontFamily: "JetBrains Mono, monospace" }}>Durum</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-[0.05em] hidden sm:table-cell" style={{ fontFamily: "JetBrains Mono, monospace" }}>Kayıt</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-[0.05em] hidden md:table-cell" style={{ fontFamily: "JetBrains Mono, monospace" }}>Onay</th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-5 py-3 text-on-surface font-medium">{sub.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono border ${
                              sub.is_active
                                ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                                : sub.unsubscribed_at
                                ? "bg-error/10 text-error border-error/20"
                                : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
                            }`}>
                              {sub.is_active ? "Aktif" : sub.unsubscribed_at ? "İptal" : "Bekliyor"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant font-mono text-[12px] hidden sm:table-cell">
                            {new Date(sub.created_at).toLocaleDateString("tr-TR")}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant font-mono text-[12px] hidden md:table-cell">
                            {sub.confirmed_at
                              ? new Date(sub.confirmed_at).toLocaleDateString("tr-TR")
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                if (!confirm(`${sub.email} silinsin mi?`)) return;
                                deleteSubscriber(sub.id).then(loadSubscribers);
                              }}
                              className="text-[12px] text-error hover:opacity-80 font-medium transition-opacity"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══ GÜVENLİK / 2FA ═══ */}
        {section === "security" && (
          <>
            <header className="h-16 border-b border-outline-variant bg-surface flex items-center px-6 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                Güvenlik
              </h1>
            </header>

            <div className="flex-1 overflow-y-auto p-6 max-w-xl space-y-6">
              {/* 2FA Durumu */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    phonelink_lock
                  </span>
                  <div>
                    <h2 className="text-[14px] font-semibold text-on-surface">İki Faktörlü Doğrulama (2FA)</h2>
                    <p className="text-[12px] text-on-surface-variant">Google Authenticator ile TOTP</p>
                  </div>
                  {totpActive !== null && (
                    <span className={`ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                      totpActive
                        ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                        : "bg-surface-container text-outline border-outline-variant"
                    }`}>
                      {totpActive ? "Aktif" : "Devre Dışı"}
                    </span>
                  )}
                </div>

                {totpMsg && (
                  <div className={`mb-4 px-3 py-2 rounded-lg text-[12px] border flex items-center gap-2 ${
                    totpMsg.ok
                      ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                      : "bg-error/10 text-error border-error/20"
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">{totpMsg.ok ? "check_circle" : "error"}</span>
                    {totpMsg.text}
                  </div>
                )}

                {/* 2FA Aktif değil */}
                {totpActive === false && !totpQr && (
                  <button
                    onClick={handleTotpSetupStart}
                    disabled={totpWorking}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                    2FA Kurulumunu Başlat
                  </button>
                )}

                {/* QR kod göster */}
                {totpQr && (
                  <div className="space-y-4">
                    <p className="text-[13px] text-on-surface-variant leading-relaxed">
                      Google Authenticator uygulamasını açın ve aşağıdaki QR kodu taratın.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <img src={totpQr} alt="TOTP QR Kodu" className="w-40 h-40 rounded-lg border border-outline-variant bg-white p-1" />
                      <div className="space-y-2">
                        <p className="text-[11px] text-outline font-mono">Manuel giriş için secret:</p>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container font-mono text-[12px] text-primary border border-outline-variant break-all">
                          {totpSecret}
                        </div>
                        <p className="text-[11px] text-outline">Tarattıktan sonra 6 haneli kodu girin ve onaylayın.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={totpSetupCode}
                        onChange={(e) => setTotpSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="w-32 px-3 py-2 text-[14px] text-center font-mono tracking-[0.3em] rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                      />
                      <button
                        onClick={handleTotpActivate}
                        disabled={totpWorking || totpSetupCode.length !== 6}
                        className="px-4 py-2 rounded-lg bg-[#10b981] text-white text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {totpWorking ? "Kontrol ediliyor..." : "Onayla & Etkinleştir"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2FA Aktif — devre dışı bırak */}
                {totpActive === true && (
                  <div className="space-y-3">
                    <p className="text-[13px] text-on-surface-variant">
                      2FA etkin. Devre dışı bırakmak için Authenticator'dan güncel kodu girin.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={totpDisableCode}
                        onChange={(e) => setTotpDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="w-32 px-3 py-2 text-[14px] text-center font-mono tracking-[0.3em] rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                      />
                      <button
                        onClick={handleTotpDisable}
                        disabled={totpWorking || totpDisableCode.length !== 6}
                        className="px-4 py-2 rounded-lg bg-error/10 text-error border border-error/20 text-[13px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        {totpWorking ? "İşleniyor..." : "2FA'yı Devre Dışı Bırak"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sentry bilgisi */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-[20px] text-[#f59e0b]">bug_report</span>
                  <div>
                    <h2 className="text-[14px] font-semibold text-on-surface">Hata Takibi (Sentry)</h2>
                    <p className="text-[12px] text-on-surface-variant">Frontend + Backend otomatik hata yakalama</p>
                  </div>
                  <span className={`ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    import.meta.env.VITE_SENTRY_DSN
                      ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                      : "bg-surface-container text-outline border-outline-variant"
                  }`}>
                    {import.meta.env.VITE_SENTRY_DSN ? "Aktif" : "Yapılandırılmadı"}
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Sentry'yi etkinleştirmek için Vercel ve Render ortam değişkenlerine ekleyin:
                </p>
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  <div className="px-3 py-2 rounded bg-surface-container border border-outline-variant text-on-surface-variant">
                    <span className="text-[#f59e0b]">Vercel</span> → VITE_SENTRY_DSN=https://...@sentry.io/...
                  </div>
                  <div className="px-3 py-2 rounded bg-surface-container border border-outline-variant text-on-surface-variant">
                    <span className="text-[#7c3aed]">Render</span> → SENTRY_DSN=https://...@sentry.io/...
                  </div>
                </div>
              </div>

              {/* Rate Limiting bilgisi */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-[20px] text-primary">speed</span>
                  <h2 className="text-[14px] font-semibold text-on-surface">Rate Limiting</h2>
                </div>
                <div className="space-y-2 text-[12px] font-mono">
                  {[
                    { label: "Newsletter abone", limit: "3 istek/saat" },
                    { label: "Yorum gönderme", limit: "5 istek/saat" },
                    { label: "İletişim formu", limit: "5 istek/saat" },
                    { label: "TOTP doğrulama", limit: "10 istek/saat" },
                    { label: "Genel API (anonim)", limit: "200 istek/dk" },
                  ].map(({ label, limit }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2 rounded bg-surface-container border border-outline-variant">
                      <span className="text-on-surface-variant">{label}</span>
                      <span className="text-primary">{limit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ SİTE AYARLARI ═══ */}
        {section === "settings" && (
          <>
            <header className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md flex items-center px-6 shrink-0">
              <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
                Site Ayarları
              </h1>
            </header>
            <div className="flex-1 overflow-y-auto">
              <SiteSettingsForm />
            </div>
          </>
        )}

        {/* Hiçbir şey yokken (mantıksal olarak ulaşılmaz ama güvenlik için) */}
        {!editorOpen && section === "posts" && postTab !== "list" && null}

      </main>
    </div>
  );
}

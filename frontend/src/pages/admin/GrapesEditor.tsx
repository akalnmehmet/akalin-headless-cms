import DOMPurify from "dompurify";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { useEffect, useRef, useState } from "react";

import api from "../../api/axiosInstance";
import { uploadMedia } from "../../api/media";
import { createPost, updatePost } from "../../api/posts";
import { useAuthStore } from "../../store/authStore";
import type { BlogPostAdmin, Category, PaginatedResponse, Tag } from "../../types";

/** Aktif dil önekini localStorage'dan okur; varsayılan "tr" */
function getCurrentLang(): string {
  return localStorage.getItem("i18n-lang") ?? "tr";
}

interface Props {
  post?: BlogPostAdmin;
  onSaved?: () => void;
  onClose?: () => void;
}

const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "pre", "code", "img", "a", "ul", "ol", "li",
  "blockquote", "strong", "em", "b", "i",
  "table", "thead", "tbody", "tr", "td", "th",
  "div", "span", "section", "br", "hr",
];
const ALLOWED_ATTR = ["href", "src", "alt", "class", "target", "rel", "width", "height", "loading"];

function hasValidJson(json: unknown): boolean {
  if (Array.isArray(json) && json.length > 0) return true;
  if (json && typeof json === "object" && Object.keys(json as object).length > 0) return true;
  return false;
}

/** Etiket rengi için %10 bg / %20 border opacity CSS nesnesi döner */
function tagColors(color: string, selected: boolean) {
  if (selected) {
    return {
      backgroundColor: `${color}18`,
      color,
      borderColor: `${color}33`,
    };
  }
  return {};
}

export default function GrapesEditor({ post, onSaved, onClose }: Props) {
  const editorRef      = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);
  const { accessToken } = useAuthStore();

  /* ── Form state ── */
  const [activeLang,         setActiveLang]         = useState<"tr" | "en">("tr");
  const [title,              setTitle]              = useState(post?.title        ?? "");
  const [titleEn,            setTitleEn]            = useState(post?.title_en     ?? "");
  const [summary,            setSummary]            = useState(post?.summary      ?? "");
  const [summaryEn,          setSummaryEn]          = useState(post?.summary_en   ?? "");
  const [contentJsonTr,      setContentJsonTr]      = useState<unknown>(post?.content_json ?? {});
  const [contentJsonEn,      setContentJsonEn]      = useState<unknown>(post?.content_json_en ?? {});
  const [metaTitle,          setMetaTitle]          = useState(post?.meta_title        ?? "");
  const [metaDescription,    setMetaDescription]    = useState(post?.meta_description  ?? "");
  const [slug,               setSlug]               = useState(post?.slug              ?? "");
  const [status,             setStatus]             = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(post?.status ?? "DRAFT");
  const [publishAt,          setPublishAt]          = useState(post?.publish_at   ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(post?.categories ?? []);
  const [selectedTags,       setSelectedTags]       = useState<string[]>(post?.tags       ?? []);

  const [allCategories,   setAllCategories]   = useState<Category[]>([]);
  const [allTags,         setAllTags]         = useState<Tag[]>([]);
  const [loadingMeta,     setLoadingMeta]     = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* ── Inline yeni kategori / etiket ── */
  const [newCatInput,    setNewCatInput]    = useState("");
  const [showNewCat,     setShowNewCat]     = useState(false);
  const [addingCat,      setAddingCat]      = useState(false);
  const [newTagInput,    setNewTagInput]    = useState("");
  const [showNewTag,     setShowNewTag]     = useState(false);
  const [addingTag,      setAddingTag]      = useState(false);

  const handleAddCategory = async () => {
    const name = newCatInput.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      const res = await api.post<Category>("/api/categories/", { name });
      setAllCategories((prev) => [...prev, res.data]);
      setSelectedCategories((prev) => [...prev, res.data.id]);
      setNewCatInput("");
      setShowNewCat(false);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { name?: string[]; detail?: string } } })
          ?.response?.data?.name?.[0] ??
        (err as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail ??
        "Kategori oluşturulamadı.";
      setError(`Kategori hatası: ${detail}`);
    } finally {
      setAddingCat(false);
    }
  };

  const handleAddTag = async () => {
    const name = newTagInput.trim();
    if (!name) return;
    setAddingTag(true);
    try {
      const res = await api.post<Tag>("/api/tags/", { name });
      setAllTags((prev) => [...prev, res.data]);
      setSelectedTags((prev) => [...prev, res.data.id]);
      setNewTagInput("");
      setShowNewTag(false);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { name?: string[]; detail?: string } } })
          ?.response?.data?.name?.[0] ??
        (err as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail ??
        "Etiket oluşturulamadı.";
      setError(`Etiket hatası: ${detail}`);
    } finally {
      setAddingTag(false);
    }
  };

  /* ── Kategori & etiket yükle ── */
  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Category>>("/api/categories/"),
      api.get<PaginatedResponse<Tag>>("/api/tags/"),
    ]).then(([catRes, tagRes]) => {
      setAllCategories(catRes.data.results);
      setAllTags(tagRes.data.results);
    }).finally(() => setLoadingMeta(false));
  }, []);

  /* ── GrapesJS ── */
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = grapesjs.init({
      container: editorRef.current,
      storageManager: false,
      height: "100%",

      // ── Canvas stili: beyaz arka plan + prose font ──────────────────────
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap",
        ],
      },

      // ── Asset Manager ───────────────────────────────────────────────────
      assetManager: {
        assets: [],
        uploadFile: async (e: Event) => {
          const input = e.target as HTMLInputElement;
          const file  = input.files?.[0];
          if (!file) return;
          try {
            const media = await uploadMedia(file);
            editor.AssetManager.add([{ src: media.file_url, name: media.original_name }]);
          } catch {
            console.error("Görsel yükleme başarısız");
          }
        },
        headers: { Authorization: `Bearer ${accessToken}` },
        autoAdd: true,
      },

      // ── Block Manager ───────────────────────────────────────────────────
      blockManager: {
        blocks: [
          // ── Metin & Başlıklar ──
          {
            id: "paragraph",
            label: "Paragraf",
            category: "Temel",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>`,
            content: "<p>Metninizi buraya yazın...</p>",
          },
          {
            id: "heading-2",
            label: "Başlık H2",
            category: "Temel",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="18" font-size="16" font-weight="700" fill="currentColor">H2</text></svg>`,
            content: "<h2>Bölüm Başlığı</h2>",
          },
          {
            id: "heading-3",
            label: "Başlık H3",
            category: "Temel",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="18" font-size="14" font-weight="700" fill="currentColor">H3</text></svg>`,
            content: "<h3>Alt Başlık</h3>",
          },
          // ── İçerik ──
          {
            id: "blockquote",
            label: "Alıntı",
            category: "İçerik",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>`,
            content: "<blockquote>Dikkat çekici bir alıntı veya önemli not buraya gelir.</blockquote>",
          },
          {
            id: "unordered-list",
            label: "Madde Listesi",
            category: "İçerik",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>`,
            content: "<ul><li>Birinci madde</li><li>İkinci madde</li><li>Üçüncü madde</li></ul>",
          },
          {
            id: "ordered-list",
            label: "Numaralı Liste",
            category: "İçerik",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" font-size="7" fill="currentColor">1.</text><text x="2" y="14" font-size="7" fill="currentColor">2.</text><text x="2" y="20" font-size="7" fill="currentColor">3.</text></svg>`,
            content: "<ol><li>Birinci adım</li><li>İkinci adım</li><li>Üçüncü adım</li></ol>",
          },
          // ── Kod ──
          {
            id: "code-inline",
            label: "Satır İçi Kod",
            category: "Kod",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
            content: "<p>Bu <code>kod parçası</code> satır içinde görünür.</p>",
          },
          {
            id: "code-block",
            label: "Kod Bloğu",
            category: "Kod",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/></svg>`,
            content: `<pre><code>// Kodunuzu buraya yazın
function merhaba() {
  console.log("Merhaba Dünya!");
}</code></pre>`,
          },
          {
            id: "code-python",
            label: "Python Kodu",
            category: "Kod",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><text x="6" y="16" font-size="9" fill="currentColor">py</text></svg>`,
            content: `<pre><code class="language-python">def merhaba(isim: str) -> str:
    return f"Merhaba, {isim}!"

print(merhaba("Dünya"))
</code></pre>`,
          },
          {
            id: "code-typescript",
            label: "TypeScript Kodu",
            category: "Kod",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><text x="5" y="16" font-size="8" fill="currentColor">TS</text></svg>`,
            content: `<pre><code class="language-typescript">interface Kullanici {
  id: number;
  isim: string;
  email: string;
}

const kullanici: Kullanici = {
  id: 1,
  isim: "Mehmet",
  email: "mehmet@example.com",
};
</code></pre>`,
          },
          // ── Medya ──
          {
            id: "image",
            label: "Görsel",
            category: "Medya",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
            content: {
              type: "image",
              style: { "max-width": "100%", "border-radius": "8px", "margin": "1rem 0" },
            },
            activate: true,
          },
          {
            id: "divider",
            label: "Ayırıcı",
            category: "Medya",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
            content: "<hr/>",
          },
          // ── Düzen ──
          {
            id: "two-columns",
            label: "2 Kolon",
            category: "Düzen",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/></svg>`,
            content: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin:1rem 0">
  <div><p>Sol kolon içeriği buraya gelir.</p></div>
  <div><p>Sağ kolon içeriği buraya gelir.</p></div>
</div>`,
          },
          {
            id: "info-box",
            label: "Bilgi Kutusu",
            category: "Düzen",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
            content: `<div style="background:rgba(0,212,255,0.08);border-left:4px solid #00d4ff;border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin:1.5rem 0">
  <strong style="color:#00d4ff">💡 Bilgi:</strong>
  <p style="margin:0.5rem 0 0">Önemli bilgi veya ipucu buraya yazılır.</p>
</div>`,
          },
          {
            id: "warning-box",
            label: "Uyarı Kutusu",
            category: "Düzen",
            media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            content: `<div style="background:rgba(239,68,68,0.08);border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin:1.5rem 0">
  <strong style="color:#ef4444">⚠️ Uyarı:</strong>
  <p style="margin:0.5rem 0 0">Dikkat edilmesi gereken önemli bir nokta.</p>
</div>`,
          },
        ],
      },
    });

    if (post) {
      if (hasValidJson(post.content_json)) {
        editor.setComponents(post.content_json as Parameters<Editor["setComponents"]>[0]);
      } else if (post.content_html) {
        editor.setComponents(post.content_html);
      }
    }

    editorInstance.current = editor;
    return () => { editor.destroy(); editorInstance.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Toggle yardımcıları ── */
  const toggleCategory = (id: string) =>
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  /* ── Dil Değiştirme ── */
  const handleLangChange = (newLang: "tr" | "en") => {
    const editor = editorInstance.current;
    if (!editor || activeLang === newLang) return;

    const currentComponents = editor.getComponents();

    if (activeLang === "tr") {
      setContentJsonTr(currentComponents);
      
      // Load EN
      editor.setComponents([]);
      if (hasValidJson(contentJsonEn)) {
        editor.setComponents(contentJsonEn as Parameters<Editor["setComponents"]>[0]);
      } else if (post?.content_html_en) {
        editor.setComponents(post.content_html_en);
      }
    } else {
      setContentJsonEn(currentComponents);
      
      // Load TR
      editor.setComponents([]);
      if (hasValidJson(contentJsonTr)) {
        editor.setComponents(contentJsonTr as Parameters<Editor["setComponents"]>[0]);
      } else if (post?.content_html) {
        editor.setComponents(post.content_html);
      }
    }
    setActiveLang(newLang);
  };

  /* ── Kaydet ── */
  const handleSave = async () => {
    const editor = editorInstance.current;
    if (!editor || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const activeComponents = editor.getComponents();
      const trJson = activeLang === "tr" ? activeComponents : contentJsonTr;
      const enJson = activeLang === "en" ? activeComponents : contentJsonEn;

      let trHtml = "";
      let enHtml = "";

      const activeHtml = editor.getHtml() + `<style>${editor.getCss()}</style>`;
      const cleanActiveHtml = DOMPurify.sanitize(activeHtml, { ALLOWED_TAGS, ALLOWED_ATTR });

      if (activeLang === "tr") {
        trHtml = cleanActiveHtml;
        if (hasValidJson(enJson)) {
          editor.setComponents(enJson as Parameters<Editor["setComponents"]>[0]);
          const enRaw = editor.getHtml() + `<style>${editor.getCss()}</style>`;
          enHtml = DOMPurify.sanitize(enRaw, { ALLOWED_TAGS, ALLOWED_ATTR });
          editor.setComponents(activeComponents);
        } else if (post?.content_html_en) {
          enHtml = post.content_html_en;
        }
      } else {
        enHtml = cleanActiveHtml;
        if (hasValidJson(trJson)) {
          editor.setComponents(trJson as Parameters<Editor["setComponents"]>[0]);
          const trRaw = editor.getHtml() + `<style>${editor.getCss()}</style>`;
          trHtml = DOMPurify.sanitize(trRaw, { ALLOWED_TAGS, ALLOWED_ATTR });
          editor.setComponents(activeComponents);
        } else if (post?.content_html) {
          trHtml = post.content_html;
        }
      }

      const payload = {
        title: title.trim(),
        title_en: titleEn.trim() || null,
        summary: summary.trim(),
        summary_en: summaryEn.trim() || null,
        meta_title: metaTitle.trim(),
        meta_description: metaDescription.trim(),
        ...(slug.trim() && { slug: slug.trim() }),
        status,
        publish_at: publishAt || null,
        content_html: trHtml,
        content_html_en: enHtml,
        content_json: trJson,
        content_json_en: enJson,
        categories: selectedCategories,
        tags: selectedTags,
      };

      if (post?.id) await updatePost(post.id, payload);
      else          await createPost(payload);
      onSaved?.();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Kaydetme başarısız.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  /* ── Son güncelleme metni ── */
  const lastUpdate = post
    ? `Son güncelleme: ${new Date(post.updated_at).toLocaleString("tr-TR")}`
    : "Yeni yazı";

  /* ── Input sınıfı ── */
  const fieldCls =
    "w-full border border-outline-variant rounded-lg bg-surface-container-lowest px-3 py-2 text-[14px] text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-150";

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Başlık çubuğu ── */}
      <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
          {post ? "Yazıyı Düzenle" : "Yeni Yazı"}
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </header>

      {/* ── Kaydırılabilir içerik ── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-10 pb-4">

        {/* Dil Seçici Sekmeler */}
        <div className="flex border-b border-outline-variant max-w-4xl">
          <button
            type="button"
            onClick={() => handleLangChange("tr")}
            className={`px-6 py-2.5 font-medium text-[14px] border-b-2 transition-colors ${
              activeLang === "tr"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Türkçe (TR)
          </button>
          <button
            type="button"
            onClick={() => handleLangChange("en")}
            className={`px-6 py-2.5 font-medium text-[14px] border-b-2 transition-colors ${
              activeLang === "en"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            İngilizce (EN)
          </button>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="bg-error-container border border-error/20 text-on-error-container text-[14px] rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* ── Meta form bölümü ── */}
        <section className="max-w-4xl flex flex-col gap-6">

          {/* Başlık — alt çizgili büyük input */}
          <div>
            <input
              className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-0 py-3 text-[32px] leading-[1.2] font-bold tracking-[-0.02em] text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-colors duration-150"
              style={{ fontFamily: "Inter, sans-serif" }}
              placeholder={activeLang === "tr" ? "Göz alıcı bir Türkçe başlık girin..." : "Enter an eye-catching English title..."}
              value={activeLang === "tr" ? title : titleEn}
              onChange={(e) => activeLang === "tr" ? setTitle(e.target.value) : setTitleEn(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* 3 sütun grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">

            {/* Sol 2 sütun: Durum + Özet */}
            <div className="md:col-span-2 flex flex-col gap-5">

              {/* Durum */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  Durum
                </label>
                <select
                  className={fieldCls + " appearance-none"}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as typeof status);
                    if (e.target.value !== "DRAFT") setPublishAt("");
                  }}
                  disabled={saving}
                >
                  <option value="DRAFT">Taslak (Yayında Değil)</option>
                  <option value="PUBLISHED">Yayında</option>
                  <option value="ARCHIVED">Arşivlendi</option>
                </select>
              </div>

              {/* Zamanlama — sadece DRAFT'ta */}
              {status === "DRAFT" && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-outline-variant accent-primary"
                      checked={!!publishAt}
                      onChange={(e) =>
                        setPublishAt(
                          e.target.checked
                            ? new Date(Date.now() + 86_400_000).toISOString().slice(0, 16)
                            : ""
                        )
                      }
                      disabled={saving}
                    />
                    <span
                      className="text-[12px] text-on-surface-variant"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      İlerideki bir tarihte yayınla
                    </span>
                  </label>
                  {!!publishAt && (
                    <>
                      <input
                        type="datetime-local"
                        className={fieldCls}
                        value={publishAt}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setPublishAt(e.target.value)}
                        disabled={saving}
                      />
                      <p
                        className="text-[11px] text-primary flex items-center gap-1"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {new Date(publishAt).toLocaleString("tr-TR", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })} tarihinde otomatik yayınlanacak
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Özet */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {activeLang === "tr" ? "Özet (TR)" : "Özet (EN)"}
                </label>
                <textarea
                  className={`${fieldCls} resize-none`}
                  placeholder={
                    activeLang === "tr"
                      ? "Arama motorları ve sosyal medya kartları için kısa bir Türkçe özet yazın..."
                      : "Write a short summary in English for search engines..."
                  }
                  maxLength={300}
                  rows={3}
                  value={activeLang === "tr" ? summary : summaryEn}
                  onChange={(e) => activeLang === "tr" ? setSummary(e.target.value) : setSummaryEn(e.target.value)}
                  disabled={saving}
                />
              </div>

              {/* URL / Slug */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase flex items-center justify-between"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  <span>URL (Slug)</span>
                  {post?.slug && slug.trim() !== post.slug && (
                    <span className="text-[#f59e0b] text-[10px] flex items-center gap-1 normal-case">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      Mevcut linkler kırılabilir
                    </span>
                  )}
                </label>
                {/* Prefix + editable slug */}
                <div className="flex items-stretch rounded-lg border border-outline-variant overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors duration-150">
                  <span
                    className="flex items-center px-3 bg-surface-container text-on-surface-variant/60 text-[13px] border-r border-outline-variant shrink-0 select-none"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    /blog/
                  </span>
                  <input
                    className="flex-1 bg-surface-container-lowest px-3 py-2 text-[14px] text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                    placeholder={
                      (activeLang === "tr" ? title : titleEn)
                        ? (activeLang === "tr" ? title : titleEn)
                            .toLowerCase()
                            .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
                            .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
                            .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60)
                        : "bos-birakilirsa-basliktan-uretilir"
                    }
                    value={slug}
                    onChange={(e) => {
                      // Sadece izin verilen karakterlere izin ver: küçük harf, rakam, tire
                      const val = e.target.value
                        .toLowerCase()
                        .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
                        .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
                        .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                      setSlug(val);
                    }}
                    disabled={saving}
                    maxLength={100}
                  />
                  {/* Başlıktan otomatik üret */}
                  {(activeLang === "tr" ? title : titleEn) && (
                    <button
                      type="button"
                      title="Başlıktan otomatik üret"
                      onClick={() => {
                        const src = activeLang === "tr" ? title : titleEn;
                        setSlug(
                          src.toLowerCase()
                            .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
                            .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
                            .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80)
                        );
                      }}
                      className="px-3 text-on-surface-variant hover:text-primary transition-colors border-l border-outline-variant bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    </button>
                  )}
                </div>
                <p
                  className="text-[11px] text-on-surface-variant/50 leading-relaxed"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {slug
                    ? `Tam URL: akalin-cms.vercel.app/tr/blog/${slug}`
                    : "Boş bırakılırsa yazı başlığından otomatik üretilir."}
                </p>
              </div>

              {/* SEO Başlık */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase flex items-center justify-between"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  <span>SEO Başlığı</span>
                  <span className={metaTitle.length > 60 ? "text-error" : "text-on-surface-variant/60"}>
                    {metaTitle.length}/60
                  </span>
                </label>
                <input
                  className={fieldCls}
                  placeholder={(activeLang === "tr" ? title : titleEn) ? `${activeLang === "tr" ? title : titleEn} — Portföy` : "Boş bırakılırsa yazı başlığı kullanılır"}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  disabled={saving}
                />
              </div>

              {/* SEO Açıklaması */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase flex items-center justify-between"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  <span>Meta Açıklaması</span>
                  <span
                    className={
                      metaDescription.length > 160
                        ? "text-error"
                        : metaDescription.length > 120
                        ? "text-[#f59e0b]"
                        : "text-on-surface-variant/60"
                    }
                  >
                    {metaDescription.length}/160
                  </span>
                </label>
                <textarea
                  className={`${fieldCls} resize-none`}
                  rows={3}
                  placeholder={
                    (activeLang === "tr" ? summary : summaryEn).trim()
                      ? `Boş bırakılırsa özet kullanılır: "${(activeLang === "tr" ? summary : summaryEn).slice(0, 80)}…"`
                      : "Google arama sonuçlarında görünecek açıklama (maks. 160 karakter)…"
                  }
                  maxLength={200}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  disabled={saving}
                />
                <p
                  className="text-[11px] text-on-surface-variant/50 leading-relaxed"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  Boş bırakılırsa özet alanı kullanılır. 120–160 karakter arası idealdir.
                </p>
              </div>
            </div>

            {/* Sağ 1 sütun: Kategoriler + Etiketler */}
            <div className="md:col-span-1 flex flex-col gap-5 md:border-l md:border-outline-variant md:pl-6">

              {/* Kategoriler */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    Kategoriler
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowNewCat((v) => !v); setNewCatInput(""); }}
                    className="flex items-center gap-1 text-[11px] text-primary hover:opacity-70 transition-opacity"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Yeni
                  </button>
                </div>

                {showNewCat && (
                  <div className="flex gap-2 mb-2">
                    <input
                      autoFocus
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setShowNewCat(false); }}
                      placeholder="Kategori adı..."
                      className="flex-1 text-[13px] bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={addingCat || !newCatInput.trim()}
                      className="text-[12px] px-3 py-1.5 rounded-lg bg-primary text-on-primary font-medium disabled:opacity-40"
                    >
                      {addingCat ? "..." : "Ekle"}
                    </button>
                  </div>
                )}

                {loadingMeta ? (
                  <p className="text-[13px] text-on-surface-variant">Yükleniyor...</p>
                ) : allCategories.length === 0 ? (
                  <p className="text-[13px] text-on-surface-variant">Henüz kategori yok</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                    {allCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-lowest"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          disabled={saving}
                        />
                        <span className="text-[14px] text-on-surface group-hover:text-primary transition-colors duration-150">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Etiketler */}
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    Etiketler
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowNewTag((v) => !v); setNewTagInput(""); }}
                    className="flex items-center gap-1 text-[11px] text-primary hover:opacity-70 transition-opacity"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Yeni
                  </button>
                </div>

                {showNewTag && (
                  <div className="flex gap-2 mb-2">
                    <input
                      autoFocus
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(); if (e.key === "Escape") setShowNewTag(false); }}
                      placeholder="Etiket adı..."
                      className="flex-1 text-[13px] bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={addingTag || !newTagInput.trim()}
                      className="text-[12px] px-3 py-1.5 rounded-lg bg-primary text-on-primary font-medium disabled:opacity-40"
                    >
                      {addingTag ? "..." : "Ekle"}
                    </button>
                  </div>
                )}

                {loadingMeta ? (
                  <p className="text-[13px] text-on-surface-variant">Yükleniyor...</p>
                ) : allTags.length === 0 ? (
                  <p className="text-[13px] text-on-surface-variant">Henüz etiket yok</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const selected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          disabled={saving}
                          className={`text-[12px] font-medium rounded-full px-3 py-1 flex items-center gap-1 border transition-colors duration-150 ${
                            selected
                              ? "hover:opacity-80"
                              : "bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-variant"
                          }`}
                          style={{
                            ...tagColors(tag.color, selected),
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {tag.name}
                          {selected && (
                            <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SEO Önizlemesi ── */}
        <section className="max-w-4xl flex flex-col gap-3">
          <h3
            className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            SEO Önizlemesi — Google
          </h3>
          <div className="border border-outline-variant rounded-xl p-5 bg-surface-container-lowest space-y-2">
            {/* URL satırı */}
            {(() => {
              const currentTitle = activeLang === "tr" ? title : titleEn;
              const previewSlug = slug.trim() || currentTitle
                .toLowerCase()
                .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
                .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
                .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50)
                || "makale-slug";
              return (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-on-surface-variant">M</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-on-surface leading-none">Mehmet Akalın</p>
                    <p className="text-[11px] text-tertiary truncate" style={{ fontFamily: "monospace" }}>
                      akalin-cms.vercel.app
                      <span className="text-tertiary/50"> › tr › blog › </span>
                      <span className={slug.trim() ? "text-tertiary" : "text-tertiary/50 italic"}>
                        {previewSlug}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Başlık */}
            {(() => {
              const currentTitle = activeLang === "tr" ? title : titleEn;
              const seoTitle = metaTitle.trim() || (currentTitle ? `${currentTitle} — Portföy` : "");
              const over = seoTitle.length > 60;
              return (
                <p
                  className={`text-[19px] leading-snug font-normal ${over ? "text-error" : "text-[#1558d6]"}`}
                  style={{ fontFamily: "arial, sans-serif" }}
                >
                  {seoTitle || <span className="text-on-surface-variant/40 italic text-[15px]">Başlık burada görünecek…</span>}
                  {over && (
                    <span className="ml-2 text-[11px] text-error font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {seoTitle.length}/60 — çok uzun
                    </span>
                  )}
                </p>
              );
            })()}

            {/* Açıklama */}
            {(() => {
              const currentSummary = activeLang === "tr" ? summary : summaryEn;
              // meta_description varsa onu kullan, yoksa summary'ye geri dön
              const seoDesc = (metaDescription.trim() || currentSummary.trim());
              const isFromMeta = !!metaDescription.trim();
              const over = seoDesc.length > 160;
              return (
                <div>
                  <p
                    className={`text-[13px] leading-relaxed ${over ? "text-error" : "text-on-surface-variant"}`}
                    style={{ fontFamily: "arial, sans-serif" }}
                  >
                    {seoDesc
                      ? (over ? seoDesc.slice(0, 157) + "…" : seoDesc)
                      : <span className="italic opacity-40">Meta açıklama veya özet burada görünecek. Maksimum 160 karakter.</span>
                    }
                    {over && (
                      <span className="ml-2 text-[11px] text-error font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {seoDesc.length}/160 — çok uzun
                      </span>
                    )}
                  </p>
                  {seoDesc && (
                    <span
                      className={`text-[10px] mt-1 inline-block ${isFromMeta ? "text-tertiary" : "text-on-surface-variant/40"}`}
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {isFromMeta ? "▸ meta açıklaması kullanılıyor" : "▸ özet kullanılıyor (meta açıklama boş)"}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Sayaçlar */}
            <div
              className="flex gap-4 pt-2 border-t border-outline-variant text-[11px] text-on-surface-variant"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {(() => {
                const currentTitle = activeLang === "tr" ? title : titleEn;
                const t = (metaTitle.trim() || (currentTitle ? `${currentTitle} — Portföy` : "")).length;
                return <span className={t > 60 ? "text-error" : ""}>Başlık: {t}/60</span>;
              })()}
              {(() => {
                const currentSummary = activeLang === "tr" ? summary : summaryEn;
                const d = (metaDescription.trim() || currentSummary.trim()).length;
                return (
                  <span className={d > 160 ? "text-error" : d > 120 ? "text-[#f59e0b]" : ""}>
                    Açıklama: {d}/160
                  </span>
                );
              })()}
            </div>
          </div>
        </section>

        {/* ── GrapesJS editör ── */}
        <section className="flex flex-col border border-outline-variant rounded-lg overflow-hidden min-h-[560px] bg-surface">
          <div
            ref={editorRef}
            className="flex-1"
            style={{ minHeight: 560 }}
          />
        </section>
      </div>

      {/* ── Alt kaydet çubuğu ── */}
      <div className="h-16 border-t border-outline-variant bg-surface/90 backdrop-blur-md px-6 flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span
            className="text-[12px]"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {lastUpdate}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!post?.slug}
            onClick={() => post?.slug && window.open(`/${getCurrentLang()}/blog/${post.slug}?preview=1`, "_blank")}
            className="px-4 py-2 rounded-lg text-[14px] font-medium text-on-surface-variant border border-outline-variant bg-surface hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title={post?.slug ? "Taslağı önizle (yeni sekme)" : "Önce kaydedin"}
          >
            <span className="material-symbols-outlined text-[16px]">preview</span>
            Önizle
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-5 py-2 rounded-lg text-[14px] font-medium text-on-primary bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity duration-150 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">publish</span>
            {saving ? "Kaydediliyor..." : post ? "Güncelle" : "Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}

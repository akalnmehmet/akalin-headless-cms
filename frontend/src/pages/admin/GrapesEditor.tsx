import DOMPurify from "dompurify";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { useEffect, useRef, useState } from "react";

import api from "../../api/axiosInstance";
import { uploadMedia } from "../../api/media";
import { createPost, updatePost } from "../../api/posts";
import { useAuthStore } from "../../store/authStore";
import type { BlogPostAdmin, Category, PaginatedResponse, Tag } from "../../types";

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
  const [title,              setTitle]              = useState(post?.title   ?? "");
  const [summary,            setSummary]            = useState(post?.summary ?? "");
  const [status,             setStatus]             = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(post?.status ?? "DRAFT");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(post?.categories ?? []);
  const [selectedTags,       setSelectedTags]       = useState<string[]>(post?.tags       ?? []);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allTags,       setAllTags]       = useState<Tag[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* ── Kategori & etiket yükle ── */
  useEffect(() => {
    api.get<PaginatedResponse<Category>>("/api/categories/").then((r) => setAllCategories(r.data.results));
    api.get<PaginatedResponse<Tag>>("/api/tags/").then((r) => setAllTags(r.data.results));
  }, []);

  /* ── GrapesJS ── */
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = grapesjs.init({
      container: editorRef.current,
      storageManager: false,
      height: "100%",
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

  /* ── Kaydet ── */
  const handleSave = async () => {
    const editor = editorInstance.current;
    if (!editor || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const rawHtml  = editor.getHtml() + `<style>${editor.getCss()}</style>`;
      const cleanHtml = DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS, ALLOWED_ATTR });
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        status,
        content_html: cleanHtml,
        content_json: editor.getComponents(),
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
              placeholder="Göz alıcı bir başlık girin..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  disabled={saving}
                >
                  <option value="DRAFT">Taslak (Yayında Değil)</option>
                  <option value="PUBLISHED">Yayında</option>
                  <option value="ARCHIVED">Arşivlendi</option>
                </select>
              </div>

              {/* Özet */}
              <div className="flex flex-col gap-1 flex-1">
                <label
                  className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  Özet (Meta Description)
                </label>
                <textarea
                  className={`${fieldCls} resize-none`}
                  placeholder="Arama motorları ve sosyal medya kartları için kısa bir özet yazın..."
                  maxLength={300}
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Sağ 1 sütun: Kategoriler + Etiketler */}
            <div className="md:col-span-1 flex flex-col gap-5 md:border-l md:border-outline-variant md:pl-6">

              {/* Kategoriler */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase mb-2"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  Kategoriler
                </label>
                {allCategories.length === 0 ? (
                  <p className="text-[13px] text-on-surface-variant">Yükleniyor...</p>
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
                <label
                  className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase mb-2"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  Etiketler
                </label>
                {allTags.length === 0 ? (
                  <p className="text-[13px] text-on-surface-variant">Yükleniyor...</p>
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
            disabled
            className="px-4 py-2 rounded-lg text-[14px] font-medium text-on-surface-variant border border-outline-variant bg-surface opacity-50 cursor-not-allowed"
            title="Yakında"
          >
            Önizleme
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

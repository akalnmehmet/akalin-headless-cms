import { useEffect, useState } from "react";

import { createProject, updateProject } from "../../api/projects";
import MediaPickerModal from "../../components/MediaPickerModal";
import type { Media, Project } from "../../types";

interface Props {
  project?: Project;
  onSaved: () => void;
  onCancel: () => void;
}

const EMPTY: Partial<Project> = {
  title: "",
  title_en: "",
  description: "",
  description_en: "",
  tech_stack: [],
  github_url: "",
  live_url: "",
  status: "ACTIVE",
  is_featured: false,
  sort_order: 0,
  start_date: null,
  end_date: null,
};

export default function ProjectForm({ project, onSaved, onCancel }: Props) {
  const [form,      setForm]      = useState<Partial<Project>>(project ?? EMPTY);
  const [techInput, setTechInput] = useState(project?.tech_stack.join(", ") ?? "");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  /* Mevcut thumbnail — thumbnail_detail (admin serializer) varsa onu kullan */
  const currentThumb: Media | null =
    (project?.thumbnail_detail as Media | null | undefined) ??
    (typeof project?.thumbnail === "object" ? project.thumbnail as Media | null : null) ??
    null;
  const [thumbPreview, setThumbPreview] = useState<Media | null>(currentThumb);

  // Proje değişince formu sıfırla
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(project ?? EMPTY);
    setTechInput(project?.tech_stack.join(", ") ?? "");
    setError(null);
    const thumb =
      (project?.thumbnail_detail as Media | null | undefined) ??
      (typeof project?.thumbnail === "object" ? project.thumbnail as Media | null : null) ??
      null;
    setThumbPreview(thumb);
  }, [project]);

  const set = (key: keyof Project, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      ...form,
      tech_stack: techInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      // Backend UUID bekler; tip baskısı gerekli
      thumbnail: (thumbPreview?.id ?? null) as unknown as null,
    };

    try {
      if (project?.id) {
        await updateProject(project.id, payload);
      } else {
        await createProject(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string; title?: string[] } } })
          ?.response?.data?.detail ??
        (err as { response?: { data?: { title?: string[] } } })?.response?.data
          ?.title?.[0] ??
        "Kayıt sırasında bir hata oluştu.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-outline-variant rounded-lg bg-surface-container-lowest px-3 py-2 text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-150 disabled:opacity-50";

  const labelCls =
    "block text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase mb-1";

  return (
    <>
    {pickerOpen && (
      <MediaPickerModal
        current={thumbPreview}
        onSelect={(media) => setThumbPreview(media)}
        onClose={() => setPickerOpen(false)}
      />
    )}
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {error && (
        <div className="bg-error-container border border-error/20 text-on-error-container text-[13px] rounded-lg px-4 py-2.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      {/* Kapak Görseli */}
      <div>
        <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
          Kapak Görseli
        </label>
        <div
          className="relative w-full h-40 rounded-xl border-2 border-dashed border-outline-variant overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
          onClick={() => setPickerOpen(true)}
        >
          {thumbPreview ? (
            <>
              <img
                src={thumbPreview.file_url}
                alt={thumbPreview.alt_text || thumbPreview.original_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-[13px] font-medium">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Değiştir
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setThumbPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-error/80 text-white flex items-center justify-center transition-colors"
                title="Görseli kaldır"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[36px]">add_photo_alternate</span>
              <span className="text-[13px] font-medium">Görsel seç</span>
            </div>
          )}
        </div>
      </div>

      {/* Başlık (TR + EN) + Durum */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Proje Adı (TR) *
          </label>
          <input
            className={inputCls}
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="AUtomotion-R"
            required
            disabled={saving}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Proje Adı (EN)
          </label>
          <input
            className={inputCls}
            value={form.title_en ?? ""}
            onChange={(e) => set("title_en", e.target.value)}
            placeholder="AUtomotion-R (EN)"
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Durum
          </label>
          <select
            className={inputCls + " appearance-none"}
            value={form.status ?? "ACTIVE"}
            onChange={(e) => set("status", e.target.value)}
            disabled={saving}
          >
            <option value="ACTIVE">Tamamlandı</option>
            <option value="IN_PROGRESS">Devam Ediyor</option>
            <option value="ARCHIVED">Arşiv</option>
          </select>
        </div>
      </div>

      {/* Açıklama (TR + EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Açıklama (TR) *
          </label>
          <textarea
            className={`${inputCls} min-h-24 resize-y`}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Projenin teknik detayları, kapsamı ve kazanımları..."
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Açıklama (EN)
          </label>
          <textarea
            className={`${inputCls} min-h-24 resize-y`}
            value={form.description_en ?? ""}
            onChange={(e) => set("description_en", e.target.value)}
            placeholder="Project technical details, scope, and key achievements..."
            disabled={saving}
          />
        </div>
      </div>

      {/* Teknoloji stack */}
      <div>
        <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
          Teknoloji Stack{" "}
          <span className="text-on-surface-variant/50 normal-case font-normal">(virgülle ayır)</span>
        </label>
        <input
          className={inputCls}
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          placeholder="Django, React, PostgreSQL, Docker"
          disabled={saving}
        />
        {techInput && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {techInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t}
                  className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full border border-outline-variant"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {t}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* URL'ler */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            GitHub URL
          </label>
          <input
            className={inputCls}
            type="url"
            value={form.github_url ?? ""}
            onChange={(e) => set("github_url", e.target.value)}
            placeholder="https://github.com/..."
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Demo URL
          </label>
          <input
            className={inputCls}
            type="url"
            value={form.live_url ?? ""}
            onChange={(e) => set("live_url", e.target.value)}
            placeholder="https://..."
            disabled={saving}
          />
        </div>
      </div>

      {/* Tarihler + Sıra + Öne çıkar */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Başlangıç
          </label>
          <input
            className={inputCls}
            type="date"
            value={form.start_date ?? ""}
            onChange={(e) => set("start_date", e.target.value || null)}
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Bitiş
          </label>
          <input
            className={inputCls}
            type="date"
            value={form.end_date ?? ""}
            onChange={(e) => set("end_date", e.target.value || null)}
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Sıra
          </label>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={form.sort_order ?? 0}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            disabled={saving}
          />
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-outline-variant bg-surface-container-low accent-primary"
              checked={form.is_featured ?? false}
              onChange={(e) => set("is_featured", e.target.checked)}
              disabled={saving}
            />
            <span className="text-[13px] text-on-surface-variant">Öne çıkar</span>
          </label>
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
          disabled={saving}
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-primary text-on-primary text-[13px] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
          disabled={saving}
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          {saving ? "Kaydediliyor..." : project ? "Güncelle" : "Oluştur"}
        </button>
      </div>
    </form>
    </>
  );
}

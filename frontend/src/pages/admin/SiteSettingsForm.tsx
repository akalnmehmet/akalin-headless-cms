import { useRef, useEffect, useState } from "react";

import api from "../../api/axiosInstance";
import { getAdminSiteSettings, updateSiteSettings } from "../../api/settings";
import MediaPickerModal from "../../components/MediaPickerModal";
import type { Media, SiteSettings } from "../../types";

async function uploadCv(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<{ cv_url: string }>("/api/admin/site-settings/cv/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.cv_url;
}

export default function SiteSettingsForm() {
  const [form, setForm]       = useState<Partial<SiteSettings>>({});
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError,     setCvError]     = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  
  const [pickerOpen, setPickerOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<Media | null>(null);

  useEffect(() => {
    getAdminSiteSettings()
      .then((data) => {
        setForm(data);
        setSkillInput(data.skills.join(", "));
        const currentImg: Media | null =
          (data.owner_image_detail as Media | null | undefined) ??
          (typeof data.owner_image === "object" ? data.owner_image as Media | null : null) ??
          null;
        setImagePreview(currentImg);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof SiteSettings, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const skills = skillInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload: Partial<SiteSettings> = {
        ...form,
        skills,
        owner_image: (imagePreview?.id ?? null) as unknown as null,
      };
      const updated = await updateSiteSettings(payload);
      setForm(updated);
      setSkillInput(updated.skills.join(", "));
      const currentImg: Media | null =
        (updated.owner_image_detail as Media | null | undefined) ??
        (typeof updated.owner_image === "object" ? updated.owner_image as Media | null : null) ??
        null;
      setImagePreview(currentImg);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-outline-variant rounded-lg bg-surface-container-lowest px-3 py-2.5 text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-150";

  const labelCls =
    "block text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase mb-1.5";

  if (loading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-3 bg-surface-variant rounded w-24 mb-2" />
            <div className="h-10 bg-surface-variant rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {pickerOpen && (
        <MediaPickerModal
          current={imagePreview}
          onSelect={(media) => setImagePreview(media)}
          onClose={() => setPickerOpen(false)}
        />
      )}
      <div className="p-6 max-w-2xl space-y-6">

        {/* Hata / başarı */}
        {error && (
          <div className="bg-error-container border border-error/20 text-on-error-container text-[13px] rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-tertiary/10 border border-tertiary/20 text-tertiary text-[13px] rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Ayarlar kaydedildi.
          </div>
        )}

        {/* Profil Fotoğrafı */}
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Profil Fotoğrafı
          </label>
          <div className="flex items-center gap-4">
            <div
              className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-outline-variant overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group shrink-0"
              onClick={() => setPickerOpen(true)}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview.file_url}
                    alt={imagePreview.alt_text || imagePreview.original_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium">
                    Değiştir
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                  <span className="text-[10px] font-semibold mt-1">Görsel Seç</span>
                </div>
              )}
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-error/20 bg-error-container/10 text-error hover:bg-error-container/20 text-[12px] font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                Fotoğrafı Kaldır
              </button>
            )}
          </div>
        </div>

        {/* İsim */}
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Sahip Adı
          </label>
        <input
          className={inputCls}
          value={form.owner_name ?? ""}
          onChange={(e) => set("owner_name", e.target.value)}
          placeholder="Mehmet Akalın"
          disabled={saving}
        />
      </div>

      {/* Ünvan / Meslek (TR + EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Ünvan / Meslek (TR)
          </label>
          <input
            className={inputCls}
            value={form.owner_title ?? ""}
            onChange={(e) => set("owner_title", e.target.value)}
            placeholder="Yazılım mühendisi"
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Ünvan / Meslek (EN)
          </label>
          <input
            className={inputCls}
            value={form.owner_title_en ?? ""}
            onChange={(e) => set("owner_title_en", e.target.value)}
            placeholder="Software engineer"
            disabled={saving}
          />
        </div>
      </div>

      {/* Bio (TR + EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Kısa Biyografi (TR)
          </label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.owner_bio ?? ""}
            onChange={(e) => set("owner_bio", e.target.value)}
            placeholder="ROS2, Django ve React ile..."
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Kısa Biyografi (EN)
          </label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.owner_bio_en ?? ""}
            onChange={(e) => set("owner_bio_en", e.target.value)}
            placeholder="I build systems stretching from robotics to web..."
            disabled={saving}
          />
        </div>
      </div>

      {/* Hakkımda Biyografisi (TR + EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Hakkımda Biyografisi (TR)
          </label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.about_bio ?? ""}
            onChange={(e) => set("about_bio", e.target.value)}
            placeholder="Boş bırakılırsa Kısa Biyografi kullanılır..."
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            Hakkımda Biyografisi (EN)
          </label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.about_bio_en ?? ""}
            onChange={(e) => set("about_bio_en", e.target.value)}
            placeholder="If left empty, Short Biography will be used..."
            disabled={saving}
          />
        </div>
      </div>

      {/* Status rozeti */}
      <div className="border border-outline-variant rounded-lg p-4 space-y-3">
        <p
          className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Durum Rozeti
        </p>
        <div className="flex items-center gap-3">
          {/* Aktif toggle */}
          <button
            type="button"
            onClick={() => set("status_active", !form.status_active)}
            disabled={saving}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              form.status_active ? "bg-primary" : "bg-surface-container-high"
            }`}
            aria-label="Durum aktifliği"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-on-primary shadow-sm transition-transform duration-200 ${
                form.status_active ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-[13px] text-on-surface-variant">
            {form.status_active ? "Aktif (yeşil nokta görünür)" : "Pasif (nokta gizli)"}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
              Durum Metni (TR)
            </label>
            <input
              className={inputCls}
              value={form.status_text ?? ""}
              onChange={(e) => set("status_text", e.target.value)}
              placeholder="Aktif geliştirme yapıyor"
              disabled={saving}
            />
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
              Durum Metni (EN)
            </label>
            <input
              className={inputCls}
              value={form.status_text_en ?? ""}
              onChange={(e) => set("status_text_en", e.target.value)}
              placeholder="Actively developing"
              disabled={saving}
            />
          </div>
        </div>

        {/* Önizleme */}
        <div className="mt-2">
          <p
            className="text-[10px] text-on-surface-variant mb-2 uppercase tracking-widest"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Önizleme
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-1.5 rounded-full font-medium border border-primary/20">
              {form.status_active && (
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              )}
              TR: {form.status_text || "Durum metni"}
            </div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-1.5 rounded-full font-medium border border-primary/20">
              {form.status_active && (
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              )}
              EN: {form.status_text_en || "Status text"}
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
          Yetenekler{" "}
          <span className="text-on-surface-variant/50 normal-case font-normal">(virgülle ayır)</span>
        </label>
        <input
          className={inputCls}
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          placeholder="Python, Django, React, TypeScript, ..."
          disabled={saving}
        />
        {skillInput && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skillInput
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => (
                <span
                  key={s}
                  className="text-xs bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full border border-outline-variant"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {s}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* CV Upload */}
      <div className="border border-outline-variant rounded-lg p-4 space-y-3">
        <p
          className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          CV / Özgeçmiş (PDF)
        </p>

        {/* Mevcut dosya */}
        {form.cv_url ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant">
            <span className="material-symbols-outlined text-[18px] text-primary">picture_as_pdf</span>
            <a
              href={form.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-[13px] text-primary hover:underline truncate"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {form.cv_url.split("/").pop()}
            </a>
            <button
              type="button"
              onClick={() => set("cv_url", "")}
              className="text-error hover:opacity-70 transition-opacity"
              aria-label="CV'yi kaldır"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        ) : (
          <p className="text-[13px] text-on-surface-variant">Henüz CV yüklenmedi.</p>
        )}

        {/* Upload butonu */}
        <input
          ref={cvInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.type !== "application/pdf") {
              setCvError("Yalnızca PDF dosyası yükleyebilirsiniz.");
              return;
            }
            if (file.size > 10 * 1024 * 1024) {
              setCvError("Dosya 10 MB'dan büyük olamaz.");
              return;
            }
            setCvError(null);
            setCvUploading(true);
            try {
              const url = await uploadCv(file);
              set("cv_url", url);
            } catch {
              setCvError("Yükleme başarısız, tekrar deneyin.");
            } finally {
              setCvUploading(false);
              e.target.value = "";
            }
          }}
        />
        <button
          type="button"
          onClick={() => cvInputRef.current?.click()}
          disabled={cvUploading || saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface-variant hover:border-primary/40 hover:text-primary disabled:opacity-50 transition-colors duration-150"
        >
          {cvUploading ? (
            <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Yükleniyor...</>
          ) : (
            <><span className="material-symbols-outlined text-[16px]">upload_file</span>{form.cv_url ? "CV'yi Değiştir" : "PDF Yükle"}</>
          )}
        </button>
        {cvError && (
          <p className="text-[12px] text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">error</span>
            {cvError}
          </p>
        )}
      </div>

      {/* Sosyal linkler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            LinkedIn URL
          </label>
          <input
            className={inputCls}
            type="url"
            value={form.linkedin_url ?? ""}
            onChange={(e) => set("linkedin_url", e.target.value)}
            placeholder="https://linkedin.com/in/..."
            disabled={saving}
          />
        </div>
      </div>

      {/* Kaydet */}
      <div className="flex justify-end pt-2 border-t border-outline-variant">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-on-primary text-[14px] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
    </>
  );
}

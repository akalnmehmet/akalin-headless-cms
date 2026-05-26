import { useEffect, useState } from "react";

import { createProject, updateProject } from "../../api/projects";
import type { Project } from "../../types";

interface Props {
  project?: Project;
  onSaved: () => void;
  onCancel: () => void;
}

const EMPTY: Partial<Project> = {
  title: "",
  description: "",
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
  const [form, setForm] = useState<Partial<Project>>(project ?? EMPTY);
  const [techInput, setTechInput] = useState(project?.tech_stack.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proje değişince formu sıfırla
  useEffect(() => {
    setForm(project ?? EMPTY);
    setTechInput(project?.tech_stack.join(", ") ?? "");
    setError(null);
  }, [project]);

  const set = (key: keyof Project, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: Partial<Project> = {
      ...form,
      tech_stack: techInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
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
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Başlık + Durum */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Proje Adı *</label>
          <input
            className={inputCls}
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="AUtomotion-R"
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls}>Durum</label>
          <select
            className={inputCls}
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

      {/* Açıklama */}
      <div>
        <label className={labelCls}>Açıklama *</label>
        <textarea
          className={`${inputCls} min-h-24 resize-y`}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Projenin teknik detayları, kapsamı ve kazanımları..."
          required
          disabled={saving}
        />
      </div>

      {/* Teknoloji stack */}
      <div>
        <label className={labelCls}>
          Teknoloji Stack{" "}
          <span className="text-gray-400 font-normal">(virgülle ayır)</span>
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
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
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
          <label className={labelCls}>GitHub URL</label>
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
          <label className={labelCls}>Demo URL</label>
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
          <label className={labelCls}>Başlangıç</label>
          <input
            className={inputCls}
            type="date"
            value={form.start_date ?? ""}
            onChange={(e) => set("start_date", e.target.value || null)}
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls}>Bitiş</label>
          <input
            className={inputCls}
            type="date"
            value={form.end_date ?? ""}
            onChange={(e) => set("end_date", e.target.value || null)}
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls}>Sıra</label>
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
              className="w-4 h-4 rounded"
              checked={form.is_featured ?? false}
              onChange={(e) => set("is_featured", e.target.checked)}
              disabled={saving}
            />
            <span className="text-sm text-gray-600">Öne çıkar</span>
          </label>
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          disabled={saving}
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          disabled={saving}
        >
          {saving ? "Kaydediliyor..." : project ? "Güncelle" : "Oluştur"}
        </button>
      </div>
    </form>
  );
}

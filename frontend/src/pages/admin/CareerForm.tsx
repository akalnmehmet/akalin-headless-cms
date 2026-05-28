import { useEffect, useState } from "react";

import { createCareerEntry, updateCareerEntry } from "../../api/career";
import type { CareerEntry, CareerEntryType } from "../../types";

interface Props {
  entry?: CareerEntry;
  onSaved: () => void;
  onCancel: () => void;
}

const EMPTY: Partial<CareerEntry> = {
  company: "",
  company_en: "",
  position: "",
  position_en: "",
  location: "",
  location_en: "",
  entry_type: "WORK",
  description: "",
  description_en: "",
  tech_stack: [],
  start_date: "",
  end_date: null,
  is_current: false,
  sort_order: 0,
};

const TYPE_OPTIONS: { value: CareerEntryType; label: string }[] = [
  { value: "WORK",      label: "İş Deneyimi"  },
  { value: "EDUCATION", label: "Eğitim"       },
  { value: "VOLUNTEER", label: "Gönüllülük"   },
];

export default function CareerForm({ entry, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<Partial<CareerEntry>>(entry ?? EMPTY);
  const [techInput, setTechInput] = useState(entry?.tech_stack.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(entry ?? EMPTY);
    setTechInput(entry?.tech_stack.join(", ") ?? "");
    setError(null);
  }, [entry]);

  const set = (key: keyof CareerEntry, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Partial<CareerEntry> = {
      ...form,
      tech_stack: techInput.split(",").map((t) => t.trim()).filter(Boolean),
      end_date: form.is_current ? null : (form.end_date || null),
    };

    try {
      if (entry?.id) await updateCareerEntry(entry.id, payload);
      else           await createCareerEntry(payload);
      onSaved();
    } catch {
      setError("Kayıt sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-outline-variant rounded-lg bg-surface-container-lowest px-3 py-2 text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-150 disabled:opacity-50";
  const labelCls =
    "block text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase mb-1";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {error && (
        <div className="bg-error-container border border-error/20 text-on-error-container text-[13px] rounded-lg px-4 py-2.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      {/* Tür + Sıra */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Tür</label>
          <select
            className={inputCls + " appearance-none"}
            value={form.entry_type ?? "WORK"}
            onChange={(e) => set("entry_type", e.target.value)}
            disabled={saving}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Sıra</label>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={form.sort_order ?? 0}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            disabled={saving}
          />
        </div>
      </div>

      {/* Pozisyon (TR + EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Pozisyon / Unvan (TR) *</label>
          <input
            className={inputCls}
            value={form.position ?? ""}
            onChange={(e) => set("position", e.target.value)}
            placeholder="Yazılım Geliştirici"
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Pozisyon / Unvan (EN)</label>
          <input
            className={inputCls}
            value={form.position_en ?? ""}
            onChange={(e) => set("position_en", e.target.value)}
            placeholder="Software Developer"
            disabled={saving}
          />
        </div>
      </div>

      {/* Şirket (TR + EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Şirket / Kurum (TR) *</label>
          <input
            className={inputCls}
            value={form.company ?? ""}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Şirket Adı"
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Şirket / Kurum (EN)</label>
          <input
            className={inputCls}
            value={form.company_en ?? ""}
            onChange={(e) => set("company_en", e.target.value)}
            placeholder="Company Name"
            disabled={saving}
          />
        </div>
      </div>

      {/* Konum (TR + EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Konum (TR)</label>
          <input
            className={inputCls}
            value={form.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            placeholder="İstanbul, Türkiye"
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Konum (EN)</label>
          <input
            className={inputCls}
            value={form.location_en ?? ""}
            onChange={(e) => set("location_en", e.target.value)}
            placeholder="Istanbul, Turkey"
            disabled={saving}
          />
        </div>
      </div>

      {/* Açıklama (TR + EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Açıklama (TR)</label>
          <textarea
            className={`${inputCls} min-h-24 resize-y`}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Bu rolde neler yaptığınızı açıklayın..."
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Açıklama (EN)</label>
          <textarea
            className={`${inputCls} min-h-24 resize-y`}
            value={form.description_en ?? ""}
            onChange={(e) => set("description_en", e.target.value)}
            placeholder="Explain what you did in this role..."
            disabled={saving}
          />
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>
          Teknolojiler <span className="text-on-surface-variant/50 normal-case font-normal">(virgülle ayır)</span>
        </label>
        <input
          className={inputCls}
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          placeholder="Python, Django, Docker"
          disabled={saving}
        />
        {techInput && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {techInput.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
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

      {/* Tarihler + Devam Ediyor */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Başlangıç *</label>
          <input
            className={inputCls}
            type="date"
            value={form.start_date ?? ""}
            onChange={(e) => set("start_date", e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelCls} style={{ fontFamily: "JetBrains Mono, monospace" }}>Bitiş</label>
          <input
            className={inputCls}
            type="date"
            value={form.end_date ?? ""}
            onChange={(e) => set("end_date", e.target.value || null)}
            disabled={saving || form.is_current}
          />
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-outline-variant bg-surface-container-low accent-primary"
              checked={form.is_current ?? false}
              onChange={(e) => set("is_current", e.target.checked)}
              disabled={saving}
            />
            <span className="text-[13px] text-on-surface-variant">Devam Ediyor</span>
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
          {saving ? "Kaydediliyor..." : entry ? "Güncelle" : "Oluştur"}
        </button>
      </div>
    </form>
  );
}

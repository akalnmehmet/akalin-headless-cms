import { useEffect, useRef, useState } from "react";

import { getMediaList, uploadMedia } from "../api/media";
import type { Media } from "../types";

interface Props {
  current: Media | null;
  onSelect: (media: Media | null) => void;
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPickerModal({ current, onSelect, onClose }: Props) {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected,  setSelected]  = useState<Media | null>(current);
  const [dragOver,  setDragOver]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getMediaList()
      .then(setMediaList)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ESC ile kapat */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(arr.map((f) => uploadMedia(f)));
      setMediaList((prev) => [...uploaded, ...prev]);
      if (uploaded.length === 1) setSelected(uploaded[0]);
    } finally {
      setUploading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-surface border border-outline-variant rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
          <h2 className="text-[16px] font-semibold text-on-surface">Görsel Seç</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-[12px] font-semibold bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[14px]">
                {uploading ? "hourglass_empty" : "upload"}
              </span>
              {uploading ? "Yükleniyor..." : "Yeni Yükle"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Grid alanı */}
        <div
          className="flex-1 overflow-y-auto p-4"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          {/* Sürükle alanı göstergesi */}
          {dragOver && (
            <div className="absolute inset-4 z-10 border-2 border-dashed border-primary rounded-xl bg-primary/5 flex items-center justify-center pointer-events-none">
              <p className="text-primary font-semibold">Görseli bırak</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-surface-variant rounded-lg animate-pulse" />
              ))}
            </div>
          ) : mediaList.length === 0 ? (
            <div
              className="h-48 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:border-primary/40 transition-colors text-on-surface-variant"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-symbols-outlined text-[40px] opacity-40">cloud_upload</span>
              <p className="text-[13px]">Görsel yok. Yüklemek için tıkla.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {mediaList.map((item) => {
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(isSelected ? null : item)}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-outline-variant hover:border-primary/40"
                    }`}
                  >
                    <img
                      src={item.file_url}
                      alt={item.alt_text || item.original_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Seçili checkmark */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-primary text-[16px]">check</span>
                        </div>
                      </div>
                    )}
                    {/* Hover: dosya bilgisi */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[10px] truncate">{item.original_name}</p>
                      <p className="text-white/60 text-[10px]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {formatBytes(item.file_size)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant shrink-0 bg-surface-container-low/50 rounded-b-2xl">
          <div className="text-[13px] text-on-surface-variant">
            {selected ? (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">image</span>
                <span className="text-on-surface font-medium truncate max-w-[200px]">
                  {selected.original_name}
                </span>
              </span>
            ) : (
              "Görsel seçilmedi"
            )}
          </div>
          <div className="flex gap-2">
            {current && (
              <button
                onClick={() => { onSelect(null); onClose(); }}
                className="px-3 py-1.5 text-[12px] text-error hover:opacity-80 transition-opacity"
              >
                Görseli Kaldır
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] text-on-surface-variant hover:text-on-surface transition-colors"
            >
              İptal
            </button>
            <button
              onClick={() => { if (selected) { onSelect(selected); onClose(); } }}
              disabled={!selected}
              className="px-4 py-1.5 text-[12px] font-semibold bg-primary text-on-primary rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Seç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

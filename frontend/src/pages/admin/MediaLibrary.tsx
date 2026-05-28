import { useCallback, useEffect, useRef, useState } from "react";

import { deleteMedia, getMediaList, uploadMedia } from "../../api/media";
import type { Media } from "../../types";

function formatBytes(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibrary() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [copiedId,  setCopiedId]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    getMediaList()
      .then(setMediaList)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setUploading(true);
    try {
      await Promise.all(arr.map((f) => uploadMedia(f)));
      load();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: Media) => {
    if (!confirm(`"${item.original_name}" silinsin mi?`)) return;
    await deleteMedia(item.id);
    load();
  };

  const copyUrl = (item: Media) => {
    navigator.clipboard.writeText(item.file_url).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col h-full">

      {/* Başlık */}
      <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-on-surface">
          Medya Kütüphanesi
          <span
            className="ml-2 text-[12px] font-medium text-on-surface-variant align-middle"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            ({mediaList.length})
          </span>
        </h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-primary text-on-primary text-[13px] font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">
            {uploading ? "hourglass_empty" : "upload"}
          </span>
          {uploading ? "Yükleniyor..." : "Görsel Yükle"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </header>

      <div className="flex-1 overflow-y-auto p-6">

        {/* Sürükle-bırak alanı */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer select-none transition-colors duration-150 ${
            dragOver
              ? "border-primary bg-primary/5 text-primary"
              : "border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[40px] block mb-2">cloud_upload</span>
          <p className="text-[14px] font-medium">
            Görselleri buraya sürükle veya tıklayarak seç
          </p>
          <p className="text-[12px] mt-1 opacity-60">PNG, JPG, WebP, GIF · Maksimum 5 MB</p>
        </div>

        {/* Görsel grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface-variant rounded-xl animate-pulse" />
            ))}
          </div>
        ) : mediaList.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">
              perm_media
            </span>
            <p className="text-[14px]">Henüz görsel yüklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-outline-variant hover:border-primary/40 transition-all duration-150 cursor-pointer"
              >
                <img
                  src={item.file_url}
                  alt={item.alt_text || item.original_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col justify-between p-2">
                  {/* Üst: aksiyon butonları */}
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => copyUrl(item)}
                      title="URL'yi kopyala"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedId === item.id ? "check" : "content_copy"}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      title="Sil"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-error/30 hover:bg-error/60 text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>

                  {/* Alt: dosya bilgisi */}
                  <div>
                    <p className="text-white text-[11px] font-medium leading-tight truncate">
                      {item.original_name}
                    </p>
                    <p
                      className="text-white/60 text-[10px] mt-0.5"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {formatBytes(item.file_size)}
                      {item.width && item.height && ` · ${item.width}×${item.height}`}
                    </p>
                  </div>
                </div>

                {/* "Kopyalandı" flash */}
                {copiedId === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[#10b981] font-semibold text-[13px]">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Kopyalandı
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

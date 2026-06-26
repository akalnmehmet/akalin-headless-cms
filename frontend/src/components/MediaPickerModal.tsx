import { useEffect, useRef, useState } from "react";
import { Upload, Check, ImageIcon, CloudUpload, Loader2, Trash2 } from "lucide-react";

import { getMediaList, uploadMedia } from "../api/media";
import { clImg } from "../utils/cloudinary";
import type { Media } from "../types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0 border-outline-variant">
        <DialogHeader className="px-5 py-4 border-b border-outline-variant shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[16px] text-on-surface">Görsel Seç</DialogTitle>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-[12px] h-8"
            >
              {uploading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Yükleniyor...</>
              ) : (
                <><Upload className="h-3.5 w-3.5" />Yeni Yükle</>
              )}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </DialogHeader>

        {/* Grid alanı */}
        <ScrollArea className="flex-1">
          <div
            className="relative p-4"
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
                <CloudUpload className="h-10 w-10 opacity-40" />
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
                        src={clImg(item.file_url, "thumbnail")}
                        alt={item.alt_text || item.original_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Seçili checkmark */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-on-primary" />
                          </div>
                        </div>
                      )}
                      {/* Hover: dosya bilgisi */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] truncate">{item.original_name}</p>
                        <p className="text-white/60 text-[10px] font-mono">{formatBytes(item.file_size)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0">
          <Separator className="bg-outline-variant" />
          <DialogFooter className="px-5 py-3 bg-surface-container-low/50 rounded-b-xl flex-row items-center justify-between">
            <div className="text-[13px] text-on-surface-variant">
              {selected ? (
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { onSelect(null); onClose(); }}
                  className="text-error hover:text-error hover:bg-error/10 text-[12px] h-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Görseli Kaldır
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="text-[12px] h-8 text-on-surface-variant">
                İptal
              </Button>
              <Button
                size="sm"
                onClick={() => { if (selected) { onSelect(selected); onClose(); } }}
                disabled={!selected}
                className="text-[12px] h-8"
              >
                Seç
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

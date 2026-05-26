import { useEffect } from "react";

/**
 * Sayfa başlığını ve meta description etiketini dinamik olarak günceller.
 * Bileşen unmount olduğunda varsayılan değerlere döner.
 */
export function useDocumentMeta(title?: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    const metaEl =
      document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = metaEl?.getAttribute("content") ?? "";

    if (title) document.title = title;
    if (description && metaEl) metaEl.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      if (metaEl) metaEl.setAttribute("content", prevDesc);
    };
  }, [title, description]);
}

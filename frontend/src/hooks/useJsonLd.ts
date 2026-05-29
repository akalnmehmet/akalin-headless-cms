import { useEffect } from "react";

/**
 * <script type="application/ld+json"> enjekte eder.
 * schema null/undefined geçilirse önceki script temizlenir.
 * @type alanı ID olarak kullanılır (birden fazla farklı tip eş zamanlı çalışabilir).
 */
export function useJsonLd(schema: Record<string, unknown> | null | undefined) {
  useEffect(() => {
    if (!schema) return;

    const type  = String(schema["@type"] ?? "unknown");
    const id    = `jsonld-${type}`;
    const prev  = document.getElementById(id);
    if (prev) prev.remove();

    const script = document.createElement("script");
    script.type        = "application/ld+json";
    script.id          = id;
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => { document.getElementById(id)?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schema)]);
}

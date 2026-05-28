import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { useDocumentMeta } from "../../hooks/useDocumentMeta";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useDocumentMeta({ title: `404 — ${t("notFound.title")}` });

  /* Giriş animasyonu */
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 text-center transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Büyük 404 */}
      <div className="relative select-none mb-2">
        <span
          className="text-[160px] sm:text-[200px] font-bold leading-none tracking-tighter text-on-surface/5"
          aria-hidden="true"
        >
          404
        </span>
        <span
          className="absolute inset-0 flex items-center justify-center text-[64px] sm:text-[80px] font-bold tracking-tight text-on-surface"
        >
          404
        </span>
      </div>

      {/* Başlık */}
      <h1 className="text-[28px] sm:text-[36px] font-bold text-on-surface mb-3 mt-4">
        {t("notFound.title")}
      </h1>
      <p className="text-[16px] text-on-surface-variant max-w-md leading-relaxed mb-10">
        {t("notFound.description")}
      </p>

      {/* Eylem butonları */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-[14px] font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">home</span>
          {t("notFound.backHome")}
        </Link>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-outline-variant text-on-surface-variant text-[14px] font-medium rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("notFound.goBack")}
        </button>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-outline-variant text-on-surface-variant text-[14px] font-medium rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">article</span>
          {t("nav.blog")}
        </Link>
      </div>

      {/* Dekoratif çizgi */}
      <div className="mt-16 flex items-center gap-4 text-on-surface-variant/30">
        <div className="h-px w-16 bg-current" />
        <span
          className="text-[11px] tracking-[0.15em] uppercase"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {t("notFound.errorCode")}
        </span>
        <div className="h-px w-16 bg-current" />
      </div>
    </div>
  );
}

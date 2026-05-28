import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getSiteSettings } from "../api/settings";
import { SUPPORTED_LANGS, type SupportedLang } from "../i18n";
import { useThemeStore } from "../store/themeStore";
import type { SiteSettings } from "../types";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { lang = "tr" } = useParams<{ lang: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [site, setSite] = useState<Pick<SiteSettings, "owner_name" | "github_url" | "linkedin_url">>({
    owner_name: "Mehmet Akalın",
    github_url:   "https://github.com",
    linkedin_url: "https://linkedin.com",
  });

  useEffect(() => {
    getSiteSettings()
      .then((s) => setSite({ owner_name: s.owner_name, github_url: s.github_url, linkedin_url: s.linkedin_url }))
      .catch(() => {});
  }, []);

  /* Route değişince mobil menüyü kapat */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* Dışarı tıklayınca kapat */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  /* Menü açıkken body scroll engelle */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /** Dil prefix'li link oluşturur: /tr/blog, /en/blog gibi */
  function lp(path: string) {
    return `/${lang}${path === "/" ? "" : path}`;
  }

  /** Geçerli sayfanın yolunu koruyarak dil değiştirir */
  function switchLang(newLang: SupportedLang) {
    // Mevcut pathname'den eski dil prefix'ini çıkar
    const withoutLangPrefix = pathname.replace(/^\/(tr|en)/, "") || "/";
    i18n.changeLanguage(newLang);
    localStorage.setItem("i18n-lang", newLang);
    navigate(`/${newLang}${withoutLangPrefix === "/" ? "" : withoutLangPrefix}`, { replace: true });
  }

  const otherLang = (SUPPORTED_LANGS.find((l) => l !== lang) ?? "en") as SupportedLang;

  const navLinks = [
    { to: lp("/"),          label: t("nav.home")     },
    { to: lp("/projects"),  label: t("nav.projects") },
    { to: lp("/career"),    label: t("nav.career")   },
    { to: lp("/blog"),      label: t("nav.blog")     },
    { to: lp("/hakkimda"),  label: t("nav.about")    },
    { to: lp("/iletisim"),  label: t("nav.contact")  },
  ];

  return (
    <div className="min-h-screen flex flex-col text-on-background antialiased">

      {/* ── Top Nav ── */}
      <nav className="bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant print:hidden">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link
            to={lp("/")}
            className="text-[20px] font-semibold tracking-tight text-on-surface hover:text-primary transition-colors duration-150"
          >
            {site.owner_name}
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ to, label }) => {
              // Aktif kontrolü: mevcut pathname ile link'in path'ini karşılaştır
              const active = pathname === to || (to !== lp("/") && pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`text-[14px] font-medium transition-colors duration-150 ${
                    active
                      ? "text-primary border-b-2 border-primary pb-0.5"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Desktop sağ: arama + dil + tema + admin */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cmd+K arama tetikleyici */}
            <button
              onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
              aria-label={`${t("nav.search")} (Ctrl+K)`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors duration-150 text-[13px]"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>{t("nav.search")}</span>
              <kbd className="text-[10px] border border-outline-variant/60 rounded px-1 py-0.5 bg-surface-container ml-1">
                ⌘K
              </kbd>
            </button>

            {/* Dil değiştirici */}
            <button
              onClick={() => switchLang(otherLang)}
              aria-label={t("lang.switchAriaLabel")}
              className="text-[13px] font-semibold px-2.5 py-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors duration-150"
            >
              {t("lang.switch")}
            </button>

            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <Link
              to="/admin"
              className="bg-primary text-on-primary text-[14px] font-medium px-4 py-2 rounded hover:opacity-90 transition-opacity duration-150"
            >
              {t("nav.admin")}
            </Link>
          </div>

          {/* Mobil: tema toggle + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => switchLang(otherLang)}
              aria-label={t("lang.switchAriaLabel")}
              className="text-[12px] font-semibold px-2 py-1 rounded border border-outline-variant text-on-surface-variant"
            >
              {t("lang.switch")}
            </button>
            <button
              onClick={toggleTheme}
              aria-label={t("theme.toggle")}
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? t("common.close") : "Menü"}
              aria-expanded={mobileOpen}
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobil drawer overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" aria-hidden="true" />
      )}

      {/* ── Mobil drawer panel ── */}
      <div
        ref={drawerRef}
        className={`fixed top-16 left-0 right-0 z-40 md:hidden bg-surface/95 backdrop-blur-md border-b border-outline-variant
          transition-all duration-200 ease-in-out overflow-hidden
          ${mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}
      >
        <div className="px-6 py-4 flex flex-col gap-1">
          {navLinks.map(({ to, label }) => {
            const active = pathname === to || (to !== lp("/") && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors duration-150 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                {label}
              </Link>
            );
          })}

          <div className="border-t border-outline-variant mt-2 pt-3">
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-primary hover:bg-primary/10 transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              {t("nav.adminPanel")}
            </Link>
          </div>
        </div>
      </div>

      {/* ── İçerik ── */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-outline-variant mt-20 print:hidden">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">

          <span className="text-[20px] font-semibold text-on-surface">
            {site.owner_name}
          </span>

          <span className="text-[14px] text-on-surface-variant">
            © {new Date().getFullYear()} {site.owner_name} · {t("footer.rights")}
          </span>

          <div className="flex gap-5">
            {[
              site.github_url   && { label: "GitHub",   href: site.github_url },
              site.linkedin_url && { label: "LinkedIn", href: site.linkedin_url },
            ].filter(Boolean).map((item) => {
              const { label, href } = item as { label: string; href: string };
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-on-surface-variant hover:text-primary transition-colors duration-150"
                >
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}

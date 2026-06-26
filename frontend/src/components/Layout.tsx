import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Menu, Moon, Sun, Search, ShieldCheck } from "lucide-react";

import { getSiteSettings } from "../api/settings";
import { SUPPORTED_LANGS, type SupportedLang } from "../i18n";
import { usePageTracking } from "../hooks/usePageTracking";
import { useThemeStore } from "../store/themeStore";
import type { SiteSettings } from "../types";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Layout({ children }: { children: React.ReactNode }) {
  usePageTracking();
  const { t, i18n } = useTranslation();
  const { lang = "tr" } = useParams<{ lang: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  /** Dil prefix'li link oluşturur: /tr/blog, /en/blog gibi */
  function lp(path: string) {
    return `/${lang}${path === "/" ? "" : path}`;
  }

  /** Geçerli sayfanın yolunu koruyarak dil değiştirir */
  function switchLang(newLang: SupportedLang) {
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
    <TooltipProvider delayDuration={300}>
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

            {/* Desktop sağ */}
            <div className="hidden md:flex items-center gap-2">
              {/* Cmd+K arama */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
                aria-label={`${t("nav.search")} (Ctrl+K)`}
                className="border-outline-variant text-on-surface-variant hover:text-on-surface gap-2 h-8 text-[13px]"
              >
                <Search className="h-3.5 w-3.5" />
                <span>{t("nav.search")}</span>
                <kbd className="text-[10px] border border-outline-variant/60 rounded px-1 py-0.5 bg-surface-container ml-1">
                  ⌘K
                </kbd>
              </Button>

              {/* Dil değiştirici */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchLang(otherLang)}
                    aria-label={t("lang.switchAriaLabel")}
                    className="border-outline-variant text-on-surface-variant hover:text-on-surface text-[13px] font-semibold h-8 px-2.5"
                  >
                    {t("lang.switch")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("lang.switchAriaLabel")}</TooltipContent>
              </Tooltip>

              {/* Tema toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
                    className="h-9 w-9 text-on-surface-variant hover:text-on-surface"
                  >
                    {theme === "dark"
                      ? <Sun className="h-4 w-4" />
                      : <Moon className="h-4 w-4" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
                </TooltipContent>
              </Tooltip>

              <Button asChild size="sm">
                <Link to="/admin">{t("nav.admin")}</Link>
              </Button>
            </div>

            {/* Mobil: dil + tema + sheet */}
            <div className="flex md:hidden items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => switchLang(otherLang)}
                aria-label={t("lang.switchAriaLabel")}
                className="text-[12px] font-semibold px-2 h-8 text-on-surface-variant"
              >
                {t("lang.switch")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={t("theme.toggle")}
                className="h-9 w-9 text-on-surface-variant"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={mobileOpen ? t("common.close") : "Menü"}
                    className="h-9 w-9 text-on-surface-variant"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="top" className="pt-14 bg-surface/95 backdrop-blur-md border-outline-variant">
                  <SheetTitle className="sr-only">Navigasyon Menüsü</SheetTitle>
                  <div className="flex flex-col gap-1">
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
                    <Separator className="my-2 bg-outline-variant" />
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-primary hover:bg-primary/10 transition-colors duration-150"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      {t("nav.adminPanel")}
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>

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
    </TooltipProvider>
  );
}

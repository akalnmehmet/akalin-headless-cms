import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import CommandPalette from "./components/CommandPalette";
import Layout from "./components/Layout";
import PageTransition from "./components/PageTransition";
import ProtectedRoute from "./components/ProtectedRoute";
import { SUPPORTED_LANGS, type SupportedLang } from "./i18n";
import { useThemeStore } from "./store/themeStore";

import i18n from "./i18n";

// Public pages — lazy loaded
const HomePage          = lazy(() => import("./pages/public/HomePage"));
const BlogListPage      = lazy(() => import("./pages/public/BlogListPage"));
const BlogPostPage      = lazy(() => import("./pages/public/BlogPostPage"));
const ProjectsPage      = lazy(() => import("./pages/public/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/public/ProjectDetailPage"));
const CareerPage        = lazy(() => import("./pages/public/CareerPage"));
const AboutPage         = lazy(() => import("./pages/public/AboutPage"));
const ContactPage       = lazy(() => import("./pages/public/ContactPage"));
const NotFoundPage      = lazy(() => import("./pages/public/NotFoundPage"));

// Admin pages — GrapesJS bu chunk'a dahil, public bundle'a dahil değil
const LoginPage      = lazy(() => import("./pages/admin/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center text-on-surface-variant text-sm">
    Yükleniyor...
  </div>
);

/**
 * Dil prefix'ini URL'den okuyarak i18n dilini günceller.
 * Geçersiz dil gelirse desteklenen ilk dile yönlendirir.
 */
function LangSync() {
  const { lang } = useParams<{ lang: string }>();
  const { pathname } = useLocation();

  useEffect(() => {
    if (lang && SUPPORTED_LANGS.includes(lang as SupportedLang)) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
        localStorage.setItem("i18n-lang", lang);
      }
    }
  }, [lang, pathname]);

  return null;
}

/** Mevcut dile göre dil prefix'li route'ları render eder */
function LangRoutes() {
  return (
    <>
      <LangSync />
      <Routes>
        <Route path="/"               element={<Layout><HomePage /></Layout>} />
        <Route path="/blog"           element={<Layout><BlogListPage /></Layout>} />
        <Route path="/blog/:slug"     element={<Layout><BlogPostPage /></Layout>} />
        <Route path="/projects"       element={<Layout><ProjectsPage /></Layout>} />
        <Route path="/projects/:slug" element={<Layout><ProjectDetailPage /></Layout>} />
        <Route path="/career"         element={<Layout><CareerPage /></Layout>} />
        {/* Türkçe URL'ler — her iki dilde de çalışır */}
        <Route path="/hakkimda"       element={<Layout><AboutPage /></Layout>} />
        <Route path="/about"          element={<Layout><AboutPage /></Layout>} />
        <Route path="/iletisim"       element={<Layout><ContactPage /></Layout>} />
        <Route path="/contact"        element={<Layout><ContactPage /></Layout>} />
        {/* 404 */}
        <Route path="*"               element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </>
  );
}

/** Tarayıcı diline göre /tr veya /en'e yönlendirir */
function RootRedirect() {
  const browserLang = navigator.language.slice(0, 2);
  const targetLang: SupportedLang = SUPPORTED_LANGS.includes(browserLang as SupportedLang)
    ? (browserLang as SupportedLang)
    : "tr";
  return <Navigate to={`/${targetLang}`} replace />;
}

export default function App() {
  const { theme } = useThemeStore();

  /* html elementine data-theme uygula — CSS token override'ları tetikler */
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") {
      html.setAttribute("data-theme", "light");
    } else {
      html.removeAttribute("data-theme");
    }
  }, [theme]);

  return (
    <BrowserRouter>
      {/* Cmd+K komut paleti — tüm sayfalarda erişilebilir */}
      <CommandPalette />
      <Suspense fallback={<Spinner />}>
        <PageTransition>
          <Routes>
            {/* / → tarayıcı diline göre /tr veya /en'e yönlendir */}
            <Route path="/" element={<RootRedirect />} />

            {/* Dil prefix'li public route'lar: /tr/* ve /en/* */}
            <Route path="/:lang/*" element={<LangRoutes />} />

            {/* Admin — dil prefix'i yok, Layout olmadan */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Dil prefix'i olmayan eski URL'ler — /tr'ye yönlendir */}
            <Route path="*" element={<Navigate to={`/tr${location.pathname}`} replace />} />
          </Routes>
        </PageTransition>
      </Suspense>
    </BrowserRouter>
  );
}

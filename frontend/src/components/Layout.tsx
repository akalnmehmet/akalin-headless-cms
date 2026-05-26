import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/",        label: "Ana Sayfa" },
  { to: "/projects", label: "Projeler"  },
  { to: "/blog",    label: "Blog"       },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background antialiased">

      {/* ── Top Nav ── */}
      <nav className="bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link
            to="/"
            className="text-[20px] font-semibold tracking-tight text-on-surface hover:text-primary transition-colors duration-150"
          >
            Mehmet Akalın
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ to, label }) => {
              const active = pathname === to;
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

          {/* Admin butonu */}
          <Link
            to="/admin"
            className="hidden md:block bg-primary text-on-primary text-[14px] font-medium px-4 py-2 rounded hover:opacity-90 transition-opacity duration-150"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* ── İçerik ── */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant mt-20">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">

          <span className="text-[20px] font-semibold text-on-surface">
            Mehmet Akalın
          </span>

          <span className="text-[14px] text-on-surface-variant">
            © 2026 Mehmet Akalın · Tüm hakları saklıdır
          </span>

          <div className="flex gap-5">
            {[
              { label: "GitHub",   href: "https://github.com" },
              { label: "LinkedIn", href: "https://linkedin.com" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-on-surface-variant hover:text-primary transition-colors duration-150"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

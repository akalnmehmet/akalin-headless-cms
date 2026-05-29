import { Link } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";

type Section =
  | "dashboard" | "posts" | "projects" | "career"
  | "media" | "analytics" | "comments" | "newsletter"
  | "calendar" | "security" | "settings";

interface Props {
  section: Section;
  onSectionChange: (s: Section) => void;
  onLogout: () => void;
  /** Mobil drawer modu: true iken overlay olarak göster */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_ITEMS: { key: Section; icon: string; label: string }[] = [
  { key: "dashboard",  icon: "space_dashboard",  label: "Dashboard"     },
  { key: "posts",      icon: "article",          label: "Yazılar"       },
  { key: "calendar",   icon: "calendar_month",   label: "Takvim"        },
  { key: "projects",   icon: "work",             label: "Projeler"      },
  { key: "career",     icon: "timeline",         label: "Kariyer"       },
  { key: "media",      icon: "perm_media",       label: "Medya"         },
  { key: "analytics",  icon: "bar_chart",        label: "Analitik"      },
  { key: "comments",   icon: "chat_bubble",      label: "Yorumlar"      },
  { key: "newsletter", icon: "mail",             label: "Newsletter"    },
  { key: "security",   icon: "shield",           label: "Güvenlik"      },
  { key: "settings",   icon: "tune",             label: "Site Ayarları" },
];

function NavContent({
  section, onSectionChange, onLogout, onMobileClose,
}: {
  section: Section;
  onSectionChange: (s: Section) => void;
  onLogout: () => void;
  onMobileClose?: () => void;
}) {
  const { theme, toggleTheme } = useThemeStore();

  const handleNav = (s: Section) => {
    onSectionChange(s);
    onMobileClose?.();
  };

  return (
    <>
      {/* Marka */}
      <div className="mb-10 px-2 flex flex-col gap-1">
        <span className="text-[20px] font-semibold leading-[1.4] text-on-surface">
          CMS Paneli
        </span>
        <span
          className="text-[12px] font-medium text-on-surface-variant"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          v1.0
        </span>
      </div>

      {/* Ana nav */}
      <div className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ key, icon, label }) => {
          const active = section === key;
          return (
            <button
              key={key}
              onClick={() => handleNav(key)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 w-full text-left transition-colors duration-150 active:scale-[0.98] ${
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span
                className="material-symbols-outlined text-[21px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              <span className="text-[14px]">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Alt kısım */}
      <div className="flex flex-col gap-0.5 border-t border-outline-variant pt-3 mt-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 hover:bg-surface-container-high transition-colors duration-150 rounded-lg w-full text-left"
        >
          <span className="material-symbols-outlined text-[21px]">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span className="text-[14px]">
            {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
          </span>
        </button>

        <Link
          to="/"
          onClick={onMobileClose}
          className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 hover:bg-surface-container-high transition-colors duration-150 rounded-lg"
        >
          <span className="material-symbols-outlined text-[21px]">open_in_new</span>
          <span className="text-[14px]">Siteye Dön</span>
        </Link>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 hover:bg-surface-container-high transition-colors duration-150 rounded-lg w-full text-left"
        >
          <span className="material-symbols-outlined text-[21px]">logout</span>
          <span className="text-[14px]">Çıkış</span>
        </button>
      </div>
    </>
  );
}

export default function AdminSideNav({
  section, onSectionChange, onLogout, mobileOpen = false, onMobileClose,
}: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface/80 backdrop-blur-md hidden md:flex flex-col p-4 z-20 overflow-y-auto">
        <NavContent
          section={section}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
        />
      </nav>

      {/* Mobil overlay drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <nav className="md:hidden fixed left-0 top-0 h-full w-72 border-r border-outline-variant bg-surface flex flex-col p-4 z-40 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span />
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Menüyü kapat"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <NavContent
              section={section}
              onSectionChange={onSectionChange}
              onLogout={onLogout}
              onMobileClose={onMobileClose}
            />
          </nav>
        </>
      )}
    </>
  );
}

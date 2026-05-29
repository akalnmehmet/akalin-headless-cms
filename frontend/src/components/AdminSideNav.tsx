import { Link } from "react-router-dom";

import { useThemeStore } from "../store/themeStore";

type Section = "dashboard" | "posts" | "projects" | "career" | "media" | "settings" | "analytics" | "comments";

interface Props {
  section: Section;
  onSectionChange: (s: Section) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { key: Section; icon: string; label: string }[] = [
  { key: "dashboard", icon: "space_dashboard",  label: "Dashboard"     },
  { key: "posts",     icon: "article",          label: "Yazılar"       },
  { key: "projects",  icon: "work",             label: "Projeler"      },
  { key: "career",    icon: "timeline",         label: "Kariyer"       },
  { key: "media",     icon: "perm_media",       label: "Medya"         },
  { key: "analytics", icon: "bar_chart",        label: "Analitik"      },
  { key: "comments",  icon: "chat_bubble",      label: "Yorumlar"      },
  { key: "settings",  icon: "tune",             label: "Site Ayarları" },
];

export default function AdminSideNav({
  section,
  onSectionChange,
  onLogout,
}: Props) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface/80 backdrop-blur-md hidden md:flex flex-col p-4 z-20">

      {/* Marka */}
      <div className="mb-12 px-2 flex flex-col gap-1">
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
      <div className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ key, icon, label }) => {
          const active = section === key;
          return (
            <button
              key={key}
              onClick={() => onSectionChange(key)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 w-full text-left transition-colors duration-150 active:scale-[0.98] ${
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={
                  active
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {icon}
              </span>
              <span className="text-[14px]">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Alt kısım */}
      <div className="flex flex-col gap-1 border-t border-outline-variant pt-4">
        {/* Tema toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container-high transition-colors duration-150 rounded-lg w-full text-left"
        >
          <span className="material-symbols-outlined text-[22px]">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span className="text-[14px]">
            {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
          </span>
        </button>

        <Link
          to="/"
          className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container-high transition-colors duration-150 rounded-lg"
        >
          <span className="material-symbols-outlined text-[22px]">open_in_new</span>
          <span className="text-[14px]">Siteye Dön</span>
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container-high transition-colors duration-150 rounded-lg w-full text-left"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span className="text-[14px]">Çıkış</span>
        </button>
      </div>
    </nav>
  );
}

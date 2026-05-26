import { Link } from "react-router-dom";

type Section = "posts" | "projects";

interface Props {
  section: Section;
  onSectionChange: (s: Section) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { key: Section; icon: string; label: string }[] = [
  { key: "posts",    icon: "article", label: "Yazılar"  },
  { key: "projects", icon: "work",    label: "Projeler" },
];

export default function AdminSideNav({
  section,
  onSectionChange,
  onLogout,
}: Props) {
  return (
    <nav className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface hidden md:flex flex-col p-4 z-20">

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

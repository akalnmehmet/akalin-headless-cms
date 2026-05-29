import { useCallback, useEffect, useRef, useState } from "react";
// @ts-expect-error react-simple-maps has no bundled types for this version
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

import { getAnalyticsStats, type AnalyticsStats } from "../../api/analytics";

// Türkiye iller GeoJSON (cihadturhan/tr-geojson)
const TURKEY_GEO = "https://cdn.jsdelivr.net/gh/cihadturhan/tr-geojson@master/geo/tr-cities-utf8.json";

/** Türkçe karakterleri ASCII'ye düşürüp küçük harf yapar — GeoIP city ismiyle GeoJSON eşleştirmek için */
function normTR(s: string): string {
  return (s || "")
    .replace(/İ/g, "i").replace(/ı/g, "i")
    .replace(/Ş/g, "s").replace(/ş/g, "s")
    .replace(/Ğ/g, "g").replace(/ğ/g, "g")
    .replace(/Ç/g, "c").replace(/ç/g, "c")
    .replace(/Ö/g, "o").replace(/ö/g, "o")
    .replace(/Ü/g, "u").replace(/ü/g, "u")
    .toLowerCase()
    .trim();
}

/** İl görüntüleme sayısına göre renk üret (koyu → cyan) */
function ilRenk(count: number, max: number): string {
  if (count === 0) return "#1a2035";
  const t = Math.pow(count / max, 0.4); // sqrt-ish — düşük değerleri öne çıkar
  return `rgba(0,212,255,${(0.18 + t * 0.82).toFixed(2)})`;
}

interface HoverInfo { name: string; count: number; x: number; y: number }

// ── Türkiye İl Haritası ────────────────────────────────────────────────────────
function TurkeyProvinceMap({ locations }: { locations: AnalyticsStats["locations"] }) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trLocs    = locations.filter((l) => l.country_code === "TR");
  const otherLocs = locations.filter((l) => l.country_code !== "TR");

  // İl adı (normalize) → toplam ziyaret
  const ilMap = new Map<string, number>();
  for (const loc of trLocs) {
    const k = normTR(loc.city);
    if (k) ilMap.set(k, (ilMap.get(k) || 0) + loc.count);
  }

  const maxCount  = Math.max(...Array.from(ilMap.values()), 1);
  const totalTR   = trLocs.reduce((s, l) => s + l.count, 0);
  const totalDiger = otherLocs.reduce((s, l) => s + l.count, 0);

  const topIller = Array.from(ilMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  const handleEnter = (name: string, count: number) =>
    (e: React.MouseEvent<SVGPathElement>) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setHover({ name, count, x: e.clientX - r.left, y: e.clientY - r.top });
    };

  const handleMove = (name: string, count: number) =>
    (e: React.MouseEvent<SVGPathElement>) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setHover({ name, count, x: e.clientX - r.left, y: e.clientY - r.top });
    };

  return (
    <div ref={containerRef} className="relative" style={{ height: 380 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 2300, center: [35.2, 39.1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={10}>
          <Geographies geography={TURKEY_GEO}>
            {({ geographies }: { geographies: unknown[] }) =>
              (geographies as Record<string, unknown>[]).map((geo) => {
                const props = geo.properties as Record<string, string> | undefined;
                const name  = props?.name || props?.NAME || "";
                const count = ilMap.get(normTR(name)) || 0;
                const fill  = ilRenk(count, maxCount);
                const key   = geo.rsmKey as string;
                return (
                  <Geography
                    key={key}
                    geography={geo}
                    fill={fill}
                    stroke="#0a0d14"
                    strokeWidth={0.5}
                    onMouseEnter={handleEnter(name, count)}
                    onMouseMove={handleMove(name, count)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      default: { outline: "none" },
                      hover:   { fill: "#00d4ff", fillOpacity: 0.95, outline: "none", cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {hover && (
        <div
          className="absolute z-20 pointer-events-none bg-surface border border-outline-variant rounded-lg px-3 py-1.5 shadow-xl text-[12px] whitespace-nowrap"
          style={{
            left: Math.min(hover.x + 14, (containerRef.current?.offsetWidth ?? 600) - 200),
            top:  Math.max(hover.y - 44, 6),
          }}
        >
          <span className="font-semibold text-on-surface">{hover.name || "—"}</span>
          {hover.count > 0
            ? <span className="text-primary font-mono ml-2">{hover.count} ziyaret</span>
            : <span className="text-on-surface-variant ml-2 font-mono">0 ziyaret</span>
          }
        </div>
      )}

      {/* Renk skalası */}
      <div className="absolute top-3 right-3 flex items-center gap-2 text-[10px] text-on-surface-variant bg-surface/80 rounded px-2 py-1 border border-outline-variant/50">
        <span className="font-mono">Az</span>
        <div className="w-16 h-2 rounded-full" style={{
          background: "linear-gradient(to right,rgba(0,212,255,.18),rgba(0,212,255,1))"
        }} />
        <span className="font-mono">Çok</span>
      </div>

      {/* Top iller */}
      <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-sm border border-outline-variant rounded-lg px-3 py-2 text-[11px] space-y-1">
        <div className="flex items-center justify-between gap-4 mb-1.5 font-mono text-on-surface-variant">
          <span className="flex items-center gap-1">🇹🇷 Türkiye</span>
          <span className="text-primary font-semibold">{totalTR} ziyaret</span>
        </div>
        {topIller.map(([il, cnt]) => (
          <div key={il} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shrink-0" />
            <span className="text-on-surface-variant font-mono capitalize"
              style={{ minWidth: 72 }}>{il}</span>
            <span className="text-primary font-mono ml-auto">{cnt}</span>
          </div>
        ))}
        {topIller.length === 0 && (
          <span className="text-on-surface-variant font-mono">Henüz veri yok</span>
        )}
      </div>

      {/* Yurt dışı özet */}
      {totalDiger > 0 && (
        <div className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur-sm border border-outline-variant rounded-lg px-3 py-2 text-[11px] max-w-[180px]">
          <div className="text-on-surface-variant font-mono mb-1">Yurt dışı: <span className="text-primary">{totalDiger}</span></div>
          {otherLocs.slice(0, 4).map((loc) => (
            <div key={`${loc.country_code}:${loc.city}`} className="flex items-center gap-1.5 text-[10px]">
              <span>
                {loc.country_code.toUpperCase().replace(/./g, (c) =>
                  String.fromCodePoint(c.codePointAt(0)! + 127397)
                )}
              </span>
              <span className="text-on-surface-variant font-mono truncate">{loc.country_name}</span>
              <span className="text-primary font-mono ml-auto">{loc.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEVICE_ICON: Record<string, string> = {
  desktop: "computer",
  mobile:  "smartphone",
  tablet:  "tablet",
  unknown: "device_unknown",
};

const DEVICE_LABEL: Record<string, string> = {
  desktop: "Desktop",
  mobile:  "Mobil",
  tablet:  "Tablet",
  unknown: "Bilinmiyor",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "az önce";
  if (m < 60) return `${m}d önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s önce`;
  return `${Math.floor(h / 24)}g önce`;
}

// ── SVG bar chart (saatlik dağılım) ──────────────────────────────────────────
function HourBarChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 100, BAR = W / 24;

  return (
    <svg viewBox={`0 0 ${W} 40`} className="w-full h-20" preserveAspectRatio="none">
      {data.map(({ hour, count }) => {
        const h = (count / max) * 32;
        const x = hour * BAR + BAR * 0.15;
        const y = 36 - h;
        const isNight = hour < 6 || hour >= 22;
        return (
          <g key={hour}>
            <rect
              x={x} y={y}
              width={BAR * 0.7} height={h}
              rx="0.5"
              fill={isNight ? "#1f2d4a" : "#00d4ff"}
              opacity={count === 0 ? 0.2 : 0.8}
            />
            {count === max && (
              <rect
                x={x} y={y}
                width={BAR * 0.7} height={h}
                rx="0.5"
                fill="#00d4ff"
                opacity={1}
              />
            )}
          </g>
        );
      })}
      {/* Saat etiketleri: 0, 6, 12, 18, 23 */}
      {[0, 6, 12, 18, 23].map((h) => (
        <text
          key={h}
          x={h * BAR + BAR / 2}
          y={39}
          textAnchor="middle"
          fontSize="2.2"
          fill="#64748b"
        >
          {h}
        </text>
      ))}
    </svg>
  );
}

// ── SVG line chart (günlük trend) ─────────────────────────────────────────────
function DayLineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null;
  const max  = Math.max(...data.map((d) => d.count), 1);
  const W = 100, H = 40, PAD = 2;
  const pts  = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - (d.count / max) * (H - PAD * 2);
    return { x, y, count: d.count, date: d.date };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = [
    `${pts[0].x},${H - PAD}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${H - PAD}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaGrad)" />
      <polyline points={polyline} fill="none" stroke="#00d4ff" strokeWidth="0.8" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="0.9" fill="#00d4ff" />
      ))}
    </svg>
  );
}

// ── Yatay bar ─────────────────────────────────────────────────────────────────
function HBar({
  label, count, max, color = "#00d4ff",
}: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[12px] text-on-surface-variant truncate"
        style={{ minWidth: 80, maxWidth: 140, fontFamily: "JetBrains Mono, monospace" }}
      >
        {label}
      </span>
      <div className="flex-1 bg-surface-variant rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-[12px] text-on-surface-variant shrink-0"
        style={{ fontFamily: "JetBrains Mono, monospace", minWidth: 32, textAlign: "right" }}
      >
        {count}
      </span>
    </div>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [stats,   setStats]   = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days,    setDays]    = useState(30);
  const [lastRef, setLastRef] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    getAnalyticsStats(days)
      .then((s) => { setStats(s); setLastRef(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    setLoading(true);
    load();
    // 30 sn'de bir otomatik yenile
    intervalRef.current = setInterval(load, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading || !stats) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-surface-variant rounded w-40" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-surface-variant rounded-xl" />)}
        </div>
        <div className="h-48 bg-surface-variant rounded-xl" />
        <div className="h-48 bg-surface-variant rounded-xl" />
      </div>
    );
  }

  const totalDevices = stats.devices.reduce((s, d) => s + d.count, 0);
  const maxRef       = Math.max(...stats.referrers.map((r) => r.count), 1);
  const maxPage      = Math.max(...stats.top_pages.map((p) => p.count), 1);
  const peakHour     = stats.views_by_hour.reduce(
    (a, b) => (b.count > a.count ? b : a), { hour: 0, count: 0 }
  );

  return (
    <div className="flex flex-col h-full">

      {/* ── Başlık ── */}
      <header className="h-16 border-b border-outline-variant bg-surface flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-semibold text-on-surface">Analitik</h1>
          {lastRef && (
            <span className="text-[11px] text-on-surface-variant font-mono">
              ↻ {lastRef.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" title="Otomatik yenileme aktif (30sn)" />
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-[12px] px-3 py-1 rounded-lg transition-colors ${
                days === d
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {d}g
            </button>
          ))}
          <button
            onClick={() => { setLoading(true); load(); }}
            className="ml-2 w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title="Yenile"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Özet kartlar ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              icon: "visibility",
              label: "Toplam Görüntüleme",
              value: stats.total_views.toLocaleString("tr-TR"),
              sub: `Son ${days} gün`,
            },
            {
              icon: "public",
              label: "Ülke Sayısı",
              value: new Set(stats.locations.map((l) => l.country_code)).size,
              sub: "benzersiz ülke",
            },
            {
              icon: "schedule",
              label: "En Yoğun Saat",
              value: `${String(peakHour.hour).padStart(2, "0")}:00`,
              sub: `${peakHour.count} görüntüleme`,
            },
            {
              icon: "trending_up",
              label: "Günlük Ortalama",
              value: days > 0 ? (stats.total_views / days).toFixed(1) : "0",
              sub: "görüntüleme/gün",
            },
            {
              icon: "download",
              label: "CV İndirme",
              value: (stats.cv_downloads ?? 0).toLocaleString("tr-TR"),
              sub: "toplam indirme",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-surface border border-outline-variant rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[18px] text-primary">{card.icon}</span>
                <span className="text-[11px] text-on-surface-variant uppercase tracking-[0.06em]"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {card.label}
                </span>
              </div>
              <p className="text-[28px] font-bold text-on-surface leading-none mb-1">{card.value}</p>
              <p className="text-[11px] text-on-surface-variant">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Türkiye İl Haritası ── */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">map</span>
              Türkiye Ziyaretçi Haritası
            </h2>
            <span className="text-[12px] text-on-surface-variant font-mono">
              {new Set(stats.locations.filter((l) => l.country_code === "TR").map((l) => normTR(l.city))).size} il · scroll ile zoom
            </span>
          </div>
          <div className="bg-[#080b11]">
            <TurkeyProvinceMap locations={stats.locations} />
          </div>
        </div>

        {/* ── Grafikler ── */}
        <div className="grid lg:grid-cols-2 gap-4">

          {/* Günlük trend */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5">
            <h2 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">trending_up</span>
              Günlük Trend
            </h2>
            <DayLineChart data={stats.views_by_day} />
            {stats.views_by_day.length > 0 && (
              <div className="flex justify-between text-[10px] text-outline mt-1 font-mono">
                <span>{stats.views_by_day[0]?.date}</span>
                <span>{stats.views_by_day[stats.views_by_day.length - 1]?.date}</span>
              </div>
            )}
          </div>

          {/* Saatlik dağılım */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5">
            <h2 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              Saatlik Dağılım
            </h2>
            <HourBarChart data={stats.views_by_hour} />
            <p className="text-[11px] text-on-surface-variant mt-2 font-mono">
              En yoğun: {String(peakHour.hour).padStart(2,"0")}:00–{String(peakHour.hour+1).padStart(2,"0")}:00
              ({peakHour.count} görüntüleme)
            </p>
          </div>
        </div>

        {/* ── Alt satır: Sayfalar + Referrer + Cihaz ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* En çok görüntülenen sayfalar */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5 lg:col-span-1">
            <h2 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">article</span>
              Popüler Sayfalar
            </h2>
            <div className="space-y-3">
              {stats.top_pages.slice(0, 10).map((p) => (
                <HBar
                  key={p.path}
                  label={p.path.replace(/^\/tr|^\/en/, "") || "/"}
                  count={p.count}
                  max={maxPage}
                />
              ))}
              {stats.top_pages.length === 0 && (
                <p className="text-[12px] text-on-surface-variant">Henüz veri yok.</p>
              )}
            </div>
          </div>

          {/* Referrer */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5">
            <h2 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">link</span>
              Kaynak (Referrer)
            </h2>
            <div className="space-y-3">
              {stats.referrers.slice(0, 10).map((r) => (
                <HBar
                  key={r.referrer}
                  label={r.referrer}
                  count={r.count}
                  max={maxRef}
                  color="#7c3aed"
                />
              ))}
              {stats.referrers.length === 0 && (
                <p className="text-[12px] text-on-surface-variant">Henüz veri yok.</p>
              )}
            </div>
          </div>

          {/* Cihaz türü */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5">
            <h2 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">devices</span>
              Cihaz Türü
            </h2>
            <div className="space-y-4">
              {stats.devices.map((d) => {
                const pct = totalDevices > 0 ? ((d.count / totalDevices) * 100).toFixed(1) : "0";
                return (
                  <div key={d.device_type} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      {DEVICE_ICON[d.device_type] ?? "device_unknown"}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[12px] text-on-surface">
                          {DEVICE_LABEL[d.device_type] ?? d.device_type}
                        </span>
                        <span className="text-[12px] text-on-surface-variant font-mono">
                          {d.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#10b981] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.devices.length === 0 && (
                <p className="text-[12px] text-on-surface-variant">Henüz veri yok.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Live feed ── */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <h2 className="text-[14px] font-semibold text-on-surface">Son Ziyaretler</h2>
            <span className="text-[11px] text-on-surface-variant">— son 20 kayıt</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant">
                  {["Sayfa", "Ülke", "Şehir", "Cihaz", "Kaynak", "Ne zaman"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium text-[11px] uppercase tracking-[0.05em]"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-4 py-2 font-mono text-on-surface truncate max-w-[200px]">
                      {r.path.replace(/^\/tr|^\/en/, "") || "/"}
                    </td>
                    <td className="px-4 py-2 text-on-surface-variant">
                      {r.country_code ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-[15px]">
                            {r.country_code.toUpperCase().replace(/./g, (c) =>
                              String.fromCodePoint(c.codePointAt(0)! + 127397)
                            )}
                          </span>
                          {r.country_name}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2 text-on-surface-variant">{r.city || "—"}</td>
                    <td className="px-4 py-2">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                        {DEVICE_ICON[r.device_type] ?? "device_unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-on-surface-variant">{r.referrer}</td>
                    <td className="px-4 py-2 font-mono text-on-surface-variant whitespace-nowrap">
                      {timeAgo(r.timestamp)}
                    </td>
                  </tr>
                ))}
                {stats.recent.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                      Henüz ziyaret kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

import api from "./axiosInstance";

export interface AnalyticsStats {
  period_days:   number;
  total_views:   number;
  cv_downloads:  number;
  views_by_day:  { date: string; count: number }[];
  views_by_hour: { hour: number; count: number }[];
  top_pages:     { path: string; count: number }[];
  referrers:     { referrer: string; count: number }[];
  devices:       { device_type: string; count: number }[];
  locations:     {
    country_code: string;
    country_name: string;
    city:         string;
    lat:          number | null;
    lng:          number | null;
    count:        number;
  }[];
  recent: {
    path:         string;
    country_code: string;
    country_name: string;
    city:         string;
    device_type:  string;
    referrer:     string;
    timestamp:    string;
  }[];
}

export function getAnalyticsStats(days = 30): Promise<AnalyticsStats> {
  return api
    .get<AnalyticsStats>(`/api/analytics/stats/?days=${days}`)
    .then((r) => r.data);
}

/** CV indirme olayını anonim olarak kaydet. */
export function trackCvDownload(): void {
  api
    .post("/api/analytics/track/", { path: "/cv-download", referrer: "" })
    .catch(() => {}); // sessizce başarısız ol, kullanıcıyı engelleme
}

export interface SearchResult {
  type: "post" | "project";
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  icon: string;
}

export function searchAll(q: string): Promise<SearchResult[]> {
  return api
    .get<{ results: SearchResult[] }>(`/api/search/?q=${encodeURIComponent(q)}`)
    .then((r) => r.data.results);
}

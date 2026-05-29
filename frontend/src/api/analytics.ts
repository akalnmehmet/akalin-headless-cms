import api from "./axiosInstance";

export interface AnalyticsStats {
  period_days:   number;
  total_views:   number;
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

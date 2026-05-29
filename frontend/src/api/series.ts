import api from "./axiosInstance";
import type { Series } from "../types";

export function getSeries(): Promise<{ count: number; results: Series[] }> {
  return api.get<{ count: number; results: Series[] }>("/api/series/").then((r) => r.data);
}

export function createSeries(data: Partial<Series>): Promise<Series> {
  return api.post<Series>("/api/series/", data).then((r) => r.data);
}

export function updateSeries(slug: string, data: Partial<Series>): Promise<Series> {
  return api.patch<Series>(`/api/series/${slug}/`, data).then((r) => r.data);
}

export function deleteSeries(slug: string): Promise<void> {
  return api.delete(`/api/series/${slug}/`).then(() => {});
}

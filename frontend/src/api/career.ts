import api from "./axiosInstance";
import type { CareerEntry } from "../types";

export const getCareer = (): Promise<CareerEntry[]> =>
  api.get<CareerEntry[]>("/api/career/").then((r) => r.data);

export const createCareerEntry = (data: Partial<CareerEntry>): Promise<CareerEntry> =>
  api.post<CareerEntry>("/api/admin/career/", data).then((r) => r.data);

export const updateCareerEntry = (id: string, data: Partial<CareerEntry>): Promise<CareerEntry> =>
  api.patch<CareerEntry>(`/api/admin/career/${id}/`, data).then((r) => r.data);

export const deleteCareerEntry = (id: string): Promise<void> =>
  api.delete(`/api/admin/career/${id}/`).then(() => undefined);

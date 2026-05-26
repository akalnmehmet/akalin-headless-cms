import type { PaginatedResponse, Project } from "../types";
import api from "./axiosInstance";

export const getProjects = (params?: Record<string, string>) =>
  api.get<PaginatedResponse<Project>>("/api/projects/", { params }).then((r) => r.data);

export const getProjectBySlug = (slug: string) =>
  api.get<Project>(`/api/projects/${slug}/`).then((r) => r.data);

// Admin
export const getAdminProjects = (params?: Record<string, string>) =>
  api.get<PaginatedResponse<Project>>("/api/admin/projects/", { params }).then((r) => r.data);

export const createProject = (data: Partial<Project>) =>
  api.post<Project>("/api/admin/projects/", data).then((r) => r.data);

export const updateProject = (id: string, data: Partial<Project>) =>
  api.put<Project>(`/api/admin/projects/${id}/`, data).then((r) => r.data);

export const patchProject = (id: string, data: Partial<Project>) =>
  api.patch<Project>(`/api/admin/projects/${id}/`, data).then((r) => r.data);

export const deleteProject = (id: string) =>
  api.delete(`/api/admin/projects/${id}/`).then((r) => r.data);

export const reorderProjects = (items: { id: string; sort_order: number }[]) =>
  api.patch("/api/admin/projects/reorder/", items).then((r) => r.data);

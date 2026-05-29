import api from "./axiosInstance";
import type { Comment } from "../types";

export function getComments(slug: string): Promise<Comment[]> {
  return api.get<Comment[]>(`/api/posts/${slug}/comments/`).then((r) => r.data);
}

export function postComment(
  slug: string,
  data: { name: string; email: string; body: string; parent?: string | null }
): Promise<{ detail: string }> {
  return api
    .post<{ detail: string }>(`/api/posts/${slug}/comments/`, data)
    .then((r) => r.data);
}

export interface AdminComment {
  id: string;
  post_slug: string;
  post_title: string;
  name: string;
  email: string;
  body: string;
  is_approved: boolean;
  parent: string | null;
  created_at: string;
}

export function getAdminComments(params?: Record<string, string>): Promise<{
  count: number;
  results: AdminComment[];
}> {
  return api
    .get("/api/admin/comments/", { params })
    .then((r) => r.data);
}

export function approveComment(id: string): Promise<void> {
  return api.post(`/api/admin/comments/${id}/approve/`).then(() => {});
}

export function rejectComment(id: string): Promise<void> {
  return api.post(`/api/admin/comments/${id}/reject/`).then(() => {});
}

export function deleteComment(id: string): Promise<void> {
  return api.delete(`/api/admin/comments/${id}/`).then(() => {});
}

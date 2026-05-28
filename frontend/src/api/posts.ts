import type { BlogPostAdmin, BlogPostDetail, BlogPostList, PaginatedResponse } from "../types";
import api from "./axiosInstance";

export const getPosts = (params?: Record<string, string>) =>
  api.get<PaginatedResponse<BlogPostList>>("/api/posts/", { params }).then((r) => r.data);

export const getPostBySlug = (slug: string) =>
  api.get<BlogPostDetail>(`/api/posts/${slug}/`).then((r) => r.data);

export const getPostBySlugPreview = (slug: string) =>
  api.get<BlogPostDetail>(`/api/posts/${slug}/`, { params: { preview: "1" } }).then((r) => r.data);

export const getRelatedPosts = (slug: string) =>
  api.get<BlogPostList[]>(`/api/posts/${slug}/related/`).then((r) => r.data);

export const incrementViewCount = (slug: string) =>
  api.post(`/api/posts/${slug}/view/`).then((r) => r.data);

// Admin endpoints
export const getAdminPosts = (params?: Record<string, string>) =>
  api.get<PaginatedResponse<BlogPostAdmin>>("/api/admin/posts/", { params }).then((r) => r.data);

export const createPost = (data: Partial<BlogPostAdmin>) =>
  api.post<BlogPostAdmin>("/api/admin/posts/", data).then((r) => r.data);

export const updatePost = (id: string, data: Partial<BlogPostAdmin>) =>
  api.put<BlogPostAdmin>(`/api/admin/posts/${id}/`, data).then((r) => r.data);

export const patchPost = (id: string, data: Partial<BlogPostAdmin>) =>
  api.patch<BlogPostAdmin>(`/api/admin/posts/${id}/`, data).then((r) => r.data);

export const deletePost = (id: string) =>
  api.delete(`/api/admin/posts/${id}/`).then((r) => r.data);

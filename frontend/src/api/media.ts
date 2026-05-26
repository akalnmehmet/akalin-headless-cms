import type { Media } from "../types";
import api from "./axiosInstance";

export const getMediaList = () =>
  api.get<Media[]>("/api/admin/media/").then((r) => r.data);

export const uploadMedia = (file: File, altText?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (altText) formData.append("alt_text", altText);

  return api
    .post<Media>("/api/admin/media/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const deleteMedia = (id: string) =>
  api.delete(`/api/admin/media/${id}/`).then((r) => r.data);

import api from "./axiosInstance";
import type { SiteSettings } from "../types";

/** Public endpoint — TranslatedSerializerMixin ile dile göre alan döndürür, EN alanlar yok */
export const getSiteSettings = (): Promise<SiteSettings> =>
  api.get<SiteSettings>("/api/site-settings/").then((r) => r.data);

/** Admin endpoint — owner_title_en, owner_bio_en vb. tüm EN alanları döndürür */
export const getAdminSiteSettings = (): Promise<SiteSettings> =>
  api.get<SiteSettings>("/api/admin/site-settings/").then((r) => r.data);

export const updateSiteSettings = (data: Partial<SiteSettings>): Promise<SiteSettings> =>
  api.patch<SiteSettings>("/api/admin/site-settings/", data).then((r) => r.data);

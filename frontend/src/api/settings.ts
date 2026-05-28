import api from "./axiosInstance";
import type { SiteSettings } from "../types";

export const getSiteSettings = (): Promise<SiteSettings> =>
  api.get<SiteSettings>("/api/site-settings/").then((r) => r.data);

export const updateSiteSettings = (data: Partial<SiteSettings>): Promise<SiteSettings> =>
  api.patch<SiteSettings>("/api/admin/site-settings/", data).then((r) => r.data);

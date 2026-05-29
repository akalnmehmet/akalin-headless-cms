import type { AuthTokens } from "../types";
import api from "./axiosInstance";

export const login = (username: string, password: string) =>
  api.post<AuthTokens>("/api/token/", { username, password }).then((r) => r.data);

export const logout = (refresh: string) =>
  api.post("/api/token/blacklist/", { refresh }).then((r) => r.data);

// 2FA destekli admin login
export interface AdminLoginResult {
  // 2FA yok → direkt token
  access?: string;
  refresh?: string;
  // 2FA var
  requires_2fa?: boolean;
  session_key?: string;
}

export const adminLogin = (username: string, password: string) =>
  api.post<AdminLoginResult>("/api/auth/login/", { username, password }).then((r) => r.data);

export const totpVerify = (session_key: string, code: string) =>
  api.post<AuthTokens>("/api/auth/totp-verify/", { session_key, code }).then((r) => r.data);

export const totpStatus = () =>
  api.get<{ is_active: boolean }>("/api/auth/totp-status/").then((r) => r.data);

export const totpSetupGet = () =>
  api.get<{ is_active: boolean; secret?: string; qr_image?: string }>("/api/auth/totp-setup/").then((r) => r.data);

export const totpSetupConfirm = (code: string) =>
  api.post<{ detail: string }>("/api/auth/totp-setup/", { code }).then((r) => r.data);

export const totpDisable = (code: string) =>
  api.post<{ detail: string }>("/api/auth/totp-disable/", { code }).then((r) => r.data);

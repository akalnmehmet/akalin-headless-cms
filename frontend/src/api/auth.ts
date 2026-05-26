import type { AuthTokens } from "../types";
import api from "./axiosInstance";

export const login = (username: string, password: string) =>
  api.post<AuthTokens>("/api/token/", { username, password }).then((r) => r.data);

export const logout = (refresh: string) =>
  api.post("/api/token/blacklist/", { refresh }).then((r) => r.data);

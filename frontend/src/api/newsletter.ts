import api from "./axiosInstance";

export function subscribe(email: string): Promise<{ detail: string }> {
  return api
    .post<{ detail: string }>("/api/newsletter/subscribe/", { email })
    .then((r) => r.data);
}

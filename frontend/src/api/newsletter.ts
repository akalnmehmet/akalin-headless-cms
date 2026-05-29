import api from "./axiosInstance";

export function subscribe(email: string): Promise<{ detail: string }> {
  return api
    .post<{ detail: string }>("/api/newsletter/subscribe/", { email })
    .then((r) => r.data);
}

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

export function getSubscribers(): Promise<{ count: number; results: Subscriber[] }> {
  return api.get<{ count: number; results: Subscriber[] }>("/api/newsletter/subscribers/").then((r) => r.data);
}

export function deleteSubscriber(id: string): Promise<void> {
  return api.delete(`/api/newsletter/subscribers/${id}/`).then(() => {});
}

export function sendTestEmail(email: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>("/api/newsletter/test-send/", { email }).then((r) => r.data);
}

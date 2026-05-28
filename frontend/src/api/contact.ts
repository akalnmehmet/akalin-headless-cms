import api from "./axiosInstance";

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export const sendContact = (data: ContactPayload) =>
  api.post<{ detail: string }>("/api/contact/", data).then((r) => r.data);

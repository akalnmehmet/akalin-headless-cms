import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../store/authStore";

// Her testten önce store'u sıfırla
beforeEach(() => {
  useAuthStore.getState().clearTokens();
  localStorage.clear();
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
  localStorage.clear();
});

describe("authStore", () => {
  it("başlangıç durumu: tokenlar null", () => {
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  it("setTokens: her iki tokeni set eder", () => {
    useAuthStore.getState().setTokens("access-abc", "refresh-xyz");
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBe("access-abc");
    expect(refreshToken).toBe("refresh-xyz");
  });

  it("setAccessToken: sadece access tokeni günceller", () => {
    useAuthStore.getState().setTokens("access-abc", "refresh-xyz");
    useAuthStore.getState().setAccessToken("access-new");
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBe("access-new");
    expect(refreshToken).toBe("refresh-xyz"); // değişmemeli
  });

  it("clearTokens: her iki tokeni null yapar", () => {
    useAuthStore.getState().setTokens("access-abc", "refresh-xyz");
    useAuthStore.getState().clearTokens();
    const { accessToken, refreshToken } = useAuthStore.getState();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  it("isAuthenticated: token varsa true döner", () => {
    useAuthStore.getState().setTokens("access-abc", "refresh-xyz");
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it("isAuthenticated: token yoksa false döner", () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("isAuthenticated: token temizlenince false döner", () => {
    useAuthStore.getState().setTokens("access-abc", "refresh-xyz");
    useAuthStore.getState().clearTokens();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("persist: tokenlar localStorage'a yazılır", () => {
    useAuthStore.getState().setTokens("access-abc", "refresh-xyz");
    const stored = JSON.parse(localStorage.getItem("auth-storage") ?? "{}");
    expect(stored.state?.accessToken).toBe("access-abc");
    expect(stored.state?.refreshToken).toBe("refresh-xyz");
  });
});

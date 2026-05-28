import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// authStore'u mock'la — gerçek localStorage'a dokunmaz
vi.mock("../store/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

import { useAuthStore } from "../store/authStore";
import api from "../api/axiosInstance";

// axios.post'u mock'la (token refresh isteği için)
vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: actual.default.create,
      post: vi.fn(),
    },
  };
});

const mockGetState = vi.mocked(useAuthStore.getState);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("axiosInstance — request interceptor", () => {
  it("accessToken varsa Authorization header ekler", async () => {
    mockGetState.mockReturnValue({
      accessToken: "test-access-token",
      refreshToken: null,
      setTokens: vi.fn(),
      setAccessToken: vi.fn(),
      clearTokens: vi.fn(),
      isAuthenticated: vi.fn(() => true),
    });

    // Interceptor'ı doğrudan test et: config nesnesi üzerinden
    // (api.interceptors.request iç fonksiyonu)
    const config = { headers: {} as Record<string, string> };

    // request interceptor'ı çalıştır
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestInterceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const result = await requestInterceptor(config);

    expect(result.headers["Authorization"]).toBe("Bearer test-access-token");
  });

  it("accessToken yoksa Authorization header eklemez", async () => {
    mockGetState.mockReturnValue({
      accessToken: null,
      refreshToken: null,
      setTokens: vi.fn(),
      setAccessToken: vi.fn(),
      clearTokens: vi.fn(),
      isAuthenticated: vi.fn(() => false),
    });

    const config = { headers: {} as Record<string, string> };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestInterceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const result = await requestInterceptor(config);

    expect(result.headers["Authorization"]).toBeUndefined();
  });
});

describe("axiosInstance — response interceptor (401 refresh akışı)", () => {
  it("refresh başarısız olursa clearTokens çağrılır", async () => {
    const mockClearTokens = vi.fn();

    mockGetState.mockReturnValue({
      accessToken: null,
      refreshToken: null, // refresh token yok → hemen clearTokens
      setTokens: vi.fn(),
      setAccessToken: vi.fn(),
      clearTokens: mockClearTokens,
      isAuthenticated: vi.fn(() => false),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;
    const error = {
      response: { status: 401 },
      config: { _retry: false, headers: {} },
    };

    await expect(responseInterceptor(error)).rejects.toEqual(error);
    expect(mockClearTokens).toHaveBeenCalled();
  });

  it("401 değilse isteği olduğu gibi reddeder", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;
    const error = {
      response: { status: 403 },
      config: { _retry: false, headers: {} },
    };

    await expect(responseInterceptor(error)).rejects.toEqual(error);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// axiosInstance'ı mock'la — gerçek HTTP isteği atmaz
vi.mock("../api/axiosInstance", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../api/axiosInstance";
import {
  createPost,
  deletePost,
  getAdminPosts,
  getPosts,
  getPostBySlug,
  getPostBySlugPreview,
  getRelatedPosts,
  incrementViewCount,
  patchPost,
  updatePost,
} from "../api/posts";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockPatch = vi.mocked(api.patch);
const mockDelete = vi.mocked(api.delete);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

// ─── Public API ──────────────────────────────────────────────────────────────

describe("getPosts", () => {
  it("doğru URL'ye GET isteği atar", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [], count: 0, next: null, previous: null } });
    await getPosts();
    expect(mockGet).toHaveBeenCalledWith("/api/posts/", { params: undefined });
  });

  it("query parametrelerini iletir", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [], count: 0, next: null, previous: null } });
    await getPosts({ categories__slug: "backend", page: "2" });
    expect(mockGet).toHaveBeenCalledWith("/api/posts/", {
      params: { categories__slug: "backend", page: "2" },
    });
  });

  it("API yanıtının data alanını döner", async () => {
    const mockData = { results: [{ id: "1", title: "Test" }], count: 1, next: null, previous: null };
    mockGet.mockResolvedValueOnce({ data: mockData });
    const result = await getPosts();
    expect(result).toEqual(mockData);
  });
});

describe("getPostBySlug", () => {
  it("slug ile doğru URL'ye GET atar", async () => {
    mockGet.mockResolvedValueOnce({ data: { slug: "test-yazi" } });
    await getPostBySlug("test-yazi");
    expect(mockGet).toHaveBeenCalledWith("/api/posts/test-yazi/");
  });
});

describe("getPostBySlugPreview", () => {
  it("?preview=1 parametresiyle GET atar", async () => {
    mockGet.mockResolvedValueOnce({ data: { slug: "taslak" } });
    await getPostBySlugPreview("taslak");
    expect(mockGet).toHaveBeenCalledWith("/api/posts/taslak/", { params: { preview: "1" } });
  });
});

describe("getRelatedPosts", () => {
  it("ilişkili yazılar URL'sine GET atar", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await getRelatedPosts("test-yazi");
    expect(mockGet).toHaveBeenCalledWith("/api/posts/test-yazi/related/");
  });
});

describe("incrementViewCount", () => {
  it("view endpoint'ine POST atar", async () => {
    mockPost.mockResolvedValueOnce({ data: { detail: "Sayıldı." } });
    await incrementViewCount("test-yazi");
    expect(mockPost).toHaveBeenCalledWith("/api/posts/test-yazi/view/");
  });
});

// ─── Admin API ────────────────────────────────────────────────────────────────

describe("getAdminPosts", () => {
  it("admin endpoint'ine GET atar", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [], count: 0 } });
    await getAdminPosts({ status: "DRAFT" });
    expect(mockGet).toHaveBeenCalledWith("/api/admin/posts/", { params: { status: "DRAFT" } });
  });
});

describe("createPost", () => {
  it("admin endpoint'ine POST atar ve veriyi iletir", async () => {
    const payload = { title: "Yeni Yazı", status: "DRAFT" as const };
    mockPost.mockResolvedValueOnce({ data: { id: "uuid-1", ...payload } });
    await createPost(payload);
    expect(mockPost).toHaveBeenCalledWith("/api/admin/posts/", payload);
  });
});

describe("updatePost", () => {
  it("PUT isteğini doğru id ile atar", async () => {
    mockPut.mockResolvedValueOnce({ data: { id: "uuid-1" } });
    await updatePost("uuid-1", { title: "Güncellendi" });
    expect(mockPut).toHaveBeenCalledWith("/api/admin/posts/uuid-1/", { title: "Güncellendi" });
  });
});

describe("patchPost", () => {
  it("PATCH isteğini doğru id ile atar", async () => {
    mockPatch.mockResolvedValueOnce({ data: { id: "uuid-1" } });
    await patchPost("uuid-1", { status: "PUBLISHED" as const });
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/posts/uuid-1/", { status: "PUBLISHED" });
  });
});

describe("deletePost", () => {
  it("DELETE isteğini doğru id ile atar", async () => {
    mockDelete.mockResolvedValueOnce({ data: {} });
    await deletePost("uuid-1");
    expect(mockDelete).toHaveBeenCalledWith("/api/admin/posts/uuid-1/");
  });
});

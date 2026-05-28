import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  createProject,
  deleteProject,
  getAdminProjects,
  getProjectBySlug,
  getProjects,
  patchProject,
  reorderProjects,
  updateProject,
} from "../api/projects";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockPatch = vi.mocked(api.patch);
const mockDelete = vi.mocked(api.delete);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

// ─── Public API ──────────────────────────────────────────────────────────────

describe("getProjects", () => {
  it("doğru URL'ye GET atar", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [], count: 0 } });
    await getProjects();
    expect(mockGet).toHaveBeenCalledWith("/api/projects/", { params: undefined });
  });

  it("query parametrelerini iletir", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [], count: 0 } });
    await getProjects({ status: "ACTIVE" });
    expect(mockGet).toHaveBeenCalledWith("/api/projects/", { params: { status: "ACTIVE" } });
  });

  it("data döner", async () => {
    const mockData = { results: [{ id: "1", title: "Proje" }], count: 1, next: null, previous: null };
    mockGet.mockResolvedValueOnce({ data: mockData });
    const result = await getProjects();
    expect(result).toEqual(mockData);
  });
});

describe("getProjectBySlug", () => {
  it("slug ile doğru URL'ye GET atar", async () => {
    mockGet.mockResolvedValueOnce({ data: { slug: "portfolyo-sitesi" } });
    await getProjectBySlug("portfolyo-sitesi");
    expect(mockGet).toHaveBeenCalledWith("/api/projects/portfolyo-sitesi/");
  });
});

// ─── Admin API ────────────────────────────────────────────────────────────────

describe("getAdminProjects", () => {
  it("admin endpoint'ine GET atar", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [], count: 0 } });
    await getAdminProjects();
    expect(mockGet).toHaveBeenCalledWith("/api/admin/projects/", { params: undefined });
  });
});

describe("createProject", () => {
  it("POST isteği atar ve payload'ı gönderir", async () => {
    const payload = { title: "Yeni Proje" };
    mockPost.mockResolvedValueOnce({ data: { id: "uuid-2", ...payload } });
    await createProject(payload);
    expect(mockPost).toHaveBeenCalledWith("/api/admin/projects/", payload);
  });
});

describe("updateProject", () => {
  it("PUT isteğini doğru id ile atar", async () => {
    mockPut.mockResolvedValueOnce({ data: { id: "uuid-2" } });
    await updateProject("uuid-2", { title: "Güncellendi" });
    expect(mockPut).toHaveBeenCalledWith("/api/admin/projects/uuid-2/", { title: "Güncellendi" });
  });
});

describe("patchProject", () => {
  it("PATCH isteğini doğru id ile atar", async () => {
    mockPatch.mockResolvedValueOnce({ data: { id: "uuid-2" } });
    await patchProject("uuid-2", { status: "ARCHIVED" as const });
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/projects/uuid-2/", { status: "ARCHIVED" });
  });
});

describe("deleteProject", () => {
  it("DELETE isteğini doğru id ile atar", async () => {
    mockDelete.mockResolvedValueOnce({ data: {} });
    await deleteProject("uuid-2");
    expect(mockDelete).toHaveBeenCalledWith("/api/admin/projects/uuid-2/");
  });
});

describe("reorderProjects", () => {
  it("reorder endpoint'ine PATCH atar ve sıralama payload'ını gönderir", async () => {
    const items = [
      { id: "uuid-1", sort_order: 0 },
      { id: "uuid-2", sort_order: 1 },
      { id: "uuid-3", sort_order: 2 },
    ];
    mockPatch.mockResolvedValueOnce({ data: {} });
    await reorderProjects(items);
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/projects/reorder/", items);
  });

  it("boş liste ile de çalışır", async () => {
    mockPatch.mockResolvedValueOnce({ data: {} });
    await reorderProjects([]);
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/projects/reorder/", []);
  });
});

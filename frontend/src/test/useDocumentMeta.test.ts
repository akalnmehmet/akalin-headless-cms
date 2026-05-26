import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useDocumentMeta } from "../hooks/useDocumentMeta";

describe("useDocumentMeta", () => {
  let metaEl: HTMLMetaElement;

  beforeEach(() => {
    document.title = "Varsayılan Başlık";
    metaEl = document.createElement("meta");
    metaEl.setAttribute("name", "description");
    metaEl.setAttribute("content", "Varsayılan açıklama");
    document.head.appendChild(metaEl);
  });

  afterEach(() => {
    metaEl.remove();
  });

  it("başlığı günceller", () => {
    renderHook(() => useDocumentMeta("Yeni Başlık"));
    expect(document.title).toBe("Yeni Başlık");
  });

  it("meta description'ı günceller", () => {
    renderHook(() => useDocumentMeta(undefined, "Yeni açıklama"));
    expect(metaEl.getAttribute("content")).toBe("Yeni açıklama");
  });

  it("unmount'ta önceki başlığa döner", () => {
    const { unmount } = renderHook(() => useDocumentMeta("Geçici Başlık"));
    expect(document.title).toBe("Geçici Başlık");
    unmount();
    expect(document.title).toBe("Varsayılan Başlık");
  });

  it("unmount'ta önceki açıklamaya döner", () => {
    const { unmount } = renderHook(() => useDocumentMeta(undefined, "Geçici açıklama"));
    unmount();
    expect(metaEl.getAttribute("content")).toBe("Varsayılan açıklama");
  });
});

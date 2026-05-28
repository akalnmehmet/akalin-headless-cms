import { act, renderHook } from "@testing-library/react";
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

  it("başlığı günceller", async () => {
    await act(async () => {
      renderHook(() => useDocumentMeta("Yeni Başlık"));
    });
    expect(document.title).toBe("Yeni Başlık");
  });

  it("meta description'ı günceller", async () => {
    await act(async () => {
      renderHook(() => useDocumentMeta(undefined, "Yeni açıklama"));
    });
    // Hook, querySelector ile meta[name="description"]'ı bulur ve günceller
    const el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    expect(el?.getAttribute("content")).toBe("Yeni açıklama");
  });

  it("unmount'ta önceki başlığa döner", async () => {
    let result: ReturnType<typeof renderHook>;
    await act(async () => {
      result = renderHook(() => useDocumentMeta("Geçici Başlık"));
    });
    expect(document.title).toBe("Geçici Başlık");
    await act(async () => {
      result!.unmount();
    });
    expect(document.title).toBe("Varsayılan Başlık");
  });

  it("unmount'ta önceki açıklamaya döner", async () => {
    let result: ReturnType<typeof renderHook>;
    await act(async () => {
      result = renderHook(() => useDocumentMeta(undefined, "Geçici açıklama"));
    });
    await act(async () => {
      result!.unmount();
    });
    expect(metaEl.getAttribute("content")).toBe("Varsayılan açıklama");
  });
});


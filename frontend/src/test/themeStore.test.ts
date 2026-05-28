import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useThemeStore } from "../store/themeStore";

beforeEach(() => {
  // Başlangıç temasını dark'a sıfırla
  useThemeStore.getState().setTheme("dark");
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("themeStore", () => {
  it("başlangıç teması dark'tır", () => {
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("setTheme('light'): temayı light yapar", () => {
    useThemeStore.getState().setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("setTheme('dark'): temayı dark'a döndürür", () => {
    useThemeStore.getState().setTheme("light");
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggleTheme: dark → light", () => {
    useThemeStore.getState().setTheme("dark");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("toggleTheme: light → dark", () => {
    useThemeStore.getState().setTheme("light");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggleTheme iki kez çağrılınca başa döner", () => {
    const initial = useThemeStore.getState().theme;
    useThemeStore.getState().toggleTheme();
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe(initial);
  });

  it("persist: tema tercihi localStorage'a yazılır", () => {
    useThemeStore.getState().setTheme("light");
    const stored = JSON.parse(localStorage.getItem("theme-preference") ?? "{}");
    expect(stored.state?.theme).toBe("light");
  });
});

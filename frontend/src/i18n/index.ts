import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import tr from "./locales/tr.json";

export const SUPPORTED_LANGS = ["tr", "en"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/** Dil prefix'li route'lar için URL yolu oluşturur */
export function langPath(lang: SupportedLang, path: string): string {
  return `/${lang}${path === "/" ? "" : path}`;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    // Dil algılama sırası: URL path > localStorage > tarayıcı ayarı
    detection: {
      order: ["path", "localStorage", "navigator"],
      lookupLocalStorage: "i18n-lang",
      // URL'deki ilk segmenti dil olarak yorumla: /tr/... veya /en/...
      lookupFromPathIndex: 0,
    },
    supportedLngs: SUPPORTED_LANGS,
    fallbackLng: "tr",
    interpolation: {
      escapeValue: false, // React zaten XSS koruması sağlıyor
    },
  });

export default i18n;

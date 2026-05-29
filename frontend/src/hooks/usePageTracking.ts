import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import api from "../api/axiosInstance";

/**
 * Her route değişikliğinde anonim sayfa görüntülemesini backend'e bildirir.
 * Admin sayfalarını takip etmez.
 */
export function usePageTracking() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    api
      .post("/api/analytics/track/", {
        path:     pathname,
        referrer: document.referrer,
      })
      .catch(() => {}); // Takip hatası sitenin işleyişini engellememeli
  }, [pathname]);
}

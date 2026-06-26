import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "og-image.png"],
      manifest: {
        name: "Mehmet Akalın — Portföy",
        short_name: "M. Akalın",
        description:
          "Yazılım geliştirme, robotik, derin öğrenme ve sistem tasarımı üzerine projeler ve yazılar.",
        theme_color: "#0a0d14",
        background_color: "#0a0d14",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "tr",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        categories: ["portfolio", "technology", "developer"],
        shortcuts: [
          {
            name: "Projeler",
            short_name: "Projeler",
            description: "Proje listesine git",
            url: "/tr/projects",
            icons: [{ src: "/pwa-192.png", sizes: "192x192" }],
          },
          {
            name: "Blog",
            short_name: "Blog",
            description: "Blog yazılarına git",
            url: "/tr/blog",
            icons: [{ src: "/pwa-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        // App shell + static assets: cache-first
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
        // API çağrıları: network-first (API yanıtları cache'lenmez)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/akalin-backend\.onrender\.com\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 dakika
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts: stale-while-revalidate
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 yıl
              },
            },
          },
          // Cloudinary görselleri: cache-first
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "cloudinary-images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 gün
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // geliştirmede SW devre dışı (HMR'yi bozmaz)
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});

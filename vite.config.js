import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "宅建士 合格ナビ",
        short_name: "合格ナビ",
        description: "宅建士試験の過去問演習＆テキスト学習アプリ",
        theme_color: "#0C1520",
        background_color: "#0C1520",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // アプリ本体が大きいので上限を引き上げ
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      }
    })
  ]
});

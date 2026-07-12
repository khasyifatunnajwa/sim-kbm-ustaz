import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4000000,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/functions\//, /^\/auth\//, /^\/offline\.html/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:js|css|woff2?|ttf)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        id: '/?source=pwa',
        name: 'SIM KBM Ustaz',
        short_name: 'SIM KBM',
        description: 'Sistem Informasi Manajemen Kegiatan Belajar Mengajar Madrasah',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        theme_color: '#059669',
        background_color: '#ffffff',
        lang: 'id',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: '/icon/16x16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: '/icon/48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: '/icon/192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon/512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon/1024x1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});

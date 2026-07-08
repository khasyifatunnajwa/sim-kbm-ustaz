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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3000000,
      },
      manifest: {
        name: 'SIM KBM Ustaz',
        short_name: 'SIM KBM',
        description: 'Sistem Informasi Manajemen Kegiatan Belajar Mengajar',
        theme_color: '#059669',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon/16x16.png', // src artinya "source" (sumber), ini menembak ke public/icon/16x16.png
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

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // Memaksa PWA jalan di mode preview
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
          // PERBAIKAN: Jalur file disesuaikan dengan folder "icon" Anda
          { src: '/icon/192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon/512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});

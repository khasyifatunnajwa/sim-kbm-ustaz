import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // KODE TAMBAHAN: Memaksa Service Worker menyala di mode preview/dev
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3000000,
      },
      manifest: {
        name: 'Sistem Informasi KBM',
        short_name: 'SIM KBM',
        description: 'Aplikasi Manajemen KBM dan Buku Saku Ustaz',
        theme_color: '#059669',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});

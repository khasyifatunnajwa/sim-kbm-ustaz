import { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 1. IMPORT PWA REGISTER (Untuk mengaktifkan Service Worker / Offline Mode)
import { registerSW } from 'virtual:pwa-register';

// 2. TanStack Query & IndexedDB untuk Cache & Offline Database
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import * as idbKeyval from 'idb-keyval';

// Aktifkan Service Worker segera saat aplikasi dibuka
registerSW({ immediate: true });

// Konfigurasi Client: Cache 24 Jam & Offline Support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // Simpan di memori HP selama 24 jam
      staleTime: 5 * 60 * 1000, // Data dianggap baru selama 5 menit
      networkMode: 'offlineFirst', // Bisa baca data walau tidak ada internet
    },
    mutations: {
      networkMode: 'offlineFirst', // Tunda pengiriman form jika offline
    }
  },
});

// Konfigurasi Jembatan ke Hardisk HP (IndexedDB)
const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => await idbKeyval.get(key),
    setItem: async (key, value) => await idbKeyval.set(key, value),
    removeItem: async (key) => await idbKeyval.del(key),
  },
});

// Global Error Boundary untuk mencegah layar putih (Blank Screen) saat error
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          color: '#1e293b',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Aplikasi gagal dimuat</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, textAlign: 'center' }}>
            {this.state.message || 'Terjadi kesalahan yang tidak terduga.'}
          </p>
          <button
            onClick={() => {
              window.localStorage.clear(); // Bersihkan cache jika terjadi error fatal
              window.location.reload();
            }}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '10px 24px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="color:red">Root element not found</div>';
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: idbPersister }}
        >
          <App />
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Di dalam APK Android, halaman dimuat dari skema lokal WebView sehingga URL
 * relatif seperti `/api/...` tidak menunjuk ke server mana pun. Hanya untuk
 * kasus itulah alamat server perlu ditambahkan.
 *
 * Sebelumnya penambalan ini berlaku untuk SEMUA lingkungan dengan IP yang
 * ditulis tetap di dalam kode. Dampaknya: `npm run dev` di laptop pun ikut
 * membaca dan MENULIS ke database produksi, dan alamat server hanya bisa
 * diganti dengan mengubah kode lalu build ulang.
 *
 * Sekarang: web memakai origin-nya sendiri (relatif), aplikasi native memakai
 * VITE_API_BASE yang ditentukan saat build.
 */
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

/**
 * Diperiksa saat fetch dipanggil, bukan sekali saat modul dimuat: jembatan
 * Capacitor mengisi window.Capacitor lewat skrip yang disuntikkan WebView, dan
 * kalau urutannya meleset sedikit saja, pemeriksaan sekali-di-awal akan
 * menyimpulkan "bukan native" lalu seluruh panggilan API di APK gagal diam-diam.
 */
const berjalanDiNative = () =>
  Boolean((window as any).Capacitor?.isNativePlatform?.());

let sudahMemperingatkan = false;

const originalFetch = window.fetch.bind(window);
window.fetch = (resource: RequestInfo | URL, config?: RequestInit) => {
  if (typeof resource === 'string' && resource.startsWith('/api') && berjalanDiNative()) {
    if (!API_BASE) {
      if (!sudahMemperingatkan) {
        sudahMemperingatkan = true;
        console.error(
          'VITE_API_BASE kosong. Aplikasi native tidak tahu alamat server, ' +
          'sehingga panggilan API akan gagal. Isi VITE_API_BASE di .env ' +
          'sebelum menjalankan `npm run build` lalu `npx cap sync android`.',
        );
      }
    } else {
      return originalFetch(`${API_BASE}${resource}`, config);
    }
  }
  return originalFetch(resource, config);
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, info: any}> {
  state = { hasError: false, error: null, info: null };

  constructor(props: {children: React.ReactNode}) {
    super(props);
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    this.setState({ info });
    console.error("ErrorBoundary caught an error", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fee' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

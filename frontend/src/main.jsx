import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('NusaMarket gagal dirender:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error-screen">
          <section className="fatal-error-card">
            <div className="fatal-error-mark">!</div>
            <p className="fatal-error-eyebrow">NUSAMARKET</p>
            <h1>Halaman gagal dimuat</h1>
            <p>Ada kesalahan saat menampilkan website. Muat ulang halaman. Jika masalah berulang, kirimkan pesan error berikut kepada pengembang.</p>
            <pre>{this.state.error?.message || 'Kesalahan JavaScript tidak diketahui.'}</pre>
            <button type="button" onClick={() => window.location.reload()}>Muat ulang halaman</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>
  );
} else {
  document.body.innerHTML = '<main style="font-family:Arial,sans-serif;padding:40px;color:#17263d"><h1>NusaMarket</h1><p>Elemen aplikasi tidak ditemukan. Periksa kembali file index.html.</p></main>';
}

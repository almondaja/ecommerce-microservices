import React, { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

function readStorage(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch (error) { console.warn(`Tidak dapat menyimpan ${key} ke localStorage:`, error); }
}
function removeStorage(key) {
  try { localStorage.removeItem(key); } catch (error) { console.warn(`Tidak dapat menghapus ${key} dari localStorage:`, error); }
}
const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
const formatDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';

async function api(path, options = {}) {
  const { token, ...config } = options;
  const headers = { ...(config.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...config.headers };
  const response = await fetch(`${API_BASE}${path}`, { ...config, headers, body: config.body ? JSON.stringify(config.body) : undefined });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `Permintaan gagal (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

const categoryImages = {
  elektronik: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=85',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
  fashion: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
  rumah: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85',
  aksesori: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=85',
  gaming: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=85',
  olahraga: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
  kecantikan: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85',
};
const fallbackImage = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85';
function productImage(category = '') {
  const key = String(category).toLowerCase();
  const match = Object.keys(categoryImages).find((name) => key.includes(name));
  return categoryImages[match] || fallbackImage;
}

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    cart: <><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"/>,
    package: <><path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z"/><path d="m3.5 7.7 8.5 4.4 8.5-4.4M12 12v9M7.5 5.2l9 4.5"/></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="19" r="1.8"/><circle cx="18" cy="19" r="1.8"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-0.8 5Z"/></>,
    box: <><path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z"/><path d="M12 12v9M3.5 7.7 12 12l8.5-4.3"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></>,
    credit: <><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M2.5 9.5h19M7 15h4"/></>,
    alert: <><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4m0 3h.01"/></>,
  };
  return <svg {...common}>{paths[name] || paths.box}</svg>;
}

function Logo({ onClick }) {
  return <button className="brand" onClick={onClick} aria-label="Kembali ke beranda"><span className="brand-mark"><Icon name="box" size={23} /></span><span>Nusa<span>Market</span></span></button>;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type || 'success'}`} role="status"><span className="toast-icon"><Icon name={toast.type === 'error' ? 'alert' : 'check'} size={17}/></span><span>{toast.message}</span><button onClick={onClose} aria-label="Tutup notifikasi"><Icon name="close" size={16}/></button></div>;
}

function Header({ user, cartCount, search, setSearch, onCart, onAuth, onLogout, page, setPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const go = (target) => { setPage(target); setMobileOpen(false); };
  return <>
    <div className="top-strip"><div className="container top-strip-inner"><span>Belanja praktis, pilihan lebih cerdas.</span><span className="top-strip-right"><Icon name="truck" size={14}/> Pengiriman ke seluruh Indonesia</span></div></div>
    <header className="site-header"><div className="container header-main">
      <Logo onClick={() => go('home')} />
      <div className="search-box"><Icon name="search" size={19}/><input value={search} onChange={(e) => { setSearch(e.target.value); if (page !== 'home') go('home'); }} placeholder="Cari produk yang kamu butuhkan..." aria-label="Cari produk"/><kbd>⌘ K</kbd></div>
      <nav className={`desktop-nav ${mobileOpen ? 'open' : ''}`}>
        <button className={page === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => go('home')}>Beranda</button>
        {user && <button className={page === 'orders' ? 'nav-link active' : 'nav-link'} onClick={() => go('orders')}>Pesanan Saya</button>}
        {user?.role === 'admin' && <button className={page === 'admin' ? 'nav-link active' : 'nav-link'} onClick={() => go('admin')}>Admin</button>}
      </nav>
      <div className="header-actions">
        <button className="icon-button cart-button" onClick={onCart} aria-label="Buka keranjang"><Icon name="cart" size={21}/>{cartCount > 0 && <span className="cart-count">{cartCount}</span>}</button>
        {user ? <div className="account-menu"><button className="account-button" onClick={() => go(user.role === 'admin' ? 'admin' : 'orders')}><span className="avatar">{user.name?.slice(0,1)?.toUpperCase() || 'U'}</span><span className="account-name">{user.name?.split(' ')[0] || 'Akun'}<small>{user.role === 'admin' ? 'Administrator' : 'Akun saya'}</small></span></button><button className="logout-button" onClick={onLogout} title="Keluar"><Icon name="logout" size={17}/></button></div> : <button className="login-button" onClick={onAuth}><Icon name="user" size={17}/> Masuk</button>}
        <button className="mobile-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu"><Icon name={mobileOpen ? 'close' : 'menu'} size={22}/></button>
      </div>
    </div></header>
  </>;
}

function ProductCard({ product, onOpen, onAdd }) {
  const outOfStock = Number(product.stock) < 1;
  return <article className="product-card">
    <button className="product-image-wrap" onClick={() => onOpen(product)} aria-label={`Lihat ${product.name}`}>
      <img src={productImage(product.category)} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.src = fallbackImage; }}/>
      <span className="product-category">{product.category}</span>
      {outOfStock && <span className="sold-out-label">Stok habis</span>}
      <span className="image-arrow"><Icon name="arrow" size={17}/></span>
    </button>
    <div className="product-card-body">
      <div className="product-title-row"><button className="product-title" onClick={() => onOpen(product)}>{product.name}</button></div>
      <p className="product-description">{product.description || 'Produk pilihan dengan kualitas terbaik untuk kebutuhanmu.'}</p>
      <div className="product-card-bottom"><div><strong>{money(product.price)}</strong><span>{Number(product.stock) > 0 ? `Stok ${product.stock}` : 'Tidak tersedia'}</span></div><button className="add-button" disabled={outOfStock} onClick={() => onAdd(product)} aria-label={`Tambah ${product.name} ke keranjang`}><Icon name="plus" size={18}/></button></div>
    </div>
  </article>;
}

function HomePage({ products, loading, error, search, category, setCategory, onOpen, onAdd, onRetry, user, onAdmin }) {
  const categories = useMemo(() => ['Semua', ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === 'Semua' || product.category === category;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${product.name} ${product.category} ${product.description || ''}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  return <main>
    <section className="hero-section"><div className="container hero-grid"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> TEMUKAN YANG KAMU CARI</div><h1>Belanja lebih mudah.<br/><em>Pilihan lebih tepat.</em></h1><p>Temukan produk pilihan untuk menemani aktivitasmu. Semua kebutuhan, dalam satu tempat.</p><div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>Jelajahi produk <Icon name="arrow" size={18}/></button><span className="hero-note"><Icon name="shield" size={16}/> Transaksi tercatat dengan aman</span></div><div className="hero-stats"><div><strong>{products.length}+</strong><span>Produk tersedia</span></div><i/><div><strong>4</strong><span>Layanan terintegrasi</span></div><i/><div><strong>24/7</strong><span>Akses belanja</span></div></div></div><div className="hero-visual"><div className="hero-image-main"><img src="https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=90" alt="Berbagai produk pilihan"/></div><div className="hero-floating-card floating-top"><span className="floating-icon"><Icon name="package" size={19}/></span><div><strong>Produk pilihan</strong><small>Dikurasi untukmu</small></div></div><div className="hero-floating-card floating-bottom"><span className="floating-icon mint"><Icon name="truck" size={19}/></span><div><strong>Belanja praktis</strong><small>Proses sederhana</small></div></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></div></div></section>
    <section className="benefit-strip"><div className="container benefit-grid"><div className="benefit-item"><span><Icon name="truck" size={21}/></span><div><strong>Pengiriman luas</strong><small>Jangkauan seluruh Indonesia</small></div></div><div className="benefit-item"><span><Icon name="shield" size={21}/></span><div><strong>Transaksi tercatat</strong><small>Riwayat pesanan tersimpan</small></div></div><div className="benefit-item"><span><Icon name="refresh" size={21}/></span><div><strong>Proses sederhana</strong><small>Checkout dalam beberapa langkah</small></div></div><div className="benefit-item"><span><Icon name="credit" size={21}/></span><div><strong>Pembayaran simulasi</strong><small>Untuk kebutuhan demonstrasi</small></div></div></div></section>
    <section className="catalog-section container" id="catalog"><div className="section-heading"><div><div className="eyebrow light-eyebrow">KATALOG NUSAMARKET</div><h2>Produk pilihan untukmu</h2><p>Jelajahi katalog dan temukan produk yang sesuai kebutuhan.</p></div><div className="catalog-count"><strong>{visibleProducts.length}</strong><span>produk ditemukan</span></div></div>
      <div className="catalog-toolbar"><div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'category-tab active' : 'category-tab'} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="sort-caption">Menampilkan katalog terbaru</span></div>
      {loading ? <div className="product-grid">{Array.from({ length: 8 }).map((_, i) => <div className="product-skeleton" key={i}><div/><span/><span/></div>)}</div> : error ? <div className="empty-state error-state"><span className="empty-icon"><Icon name="alert" size={26}/></span><h3>Katalog belum dapat dimuat</h3><p>{error}</p><button className="secondary-button" onClick={onRetry}>Coba lagi</button></div> : visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onOpen={onOpen} onAdd={onAdd}/>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="package" size={27}/></span><h3>{products.length ? 'Produk tidak ditemukan' : 'Katalog sedang disiapkan'}</h3><p>{products.length ? 'Coba gunakan kata kunci atau kategori lain.' : user?.role === 'admin' ? 'Tambahkan produk pertama melalui halaman Admin.' : 'Belum ada produk yang tersedia. Silakan kembali beberapa saat lagi.'}</p>{user?.role === 'admin' && <button className="primary-button" onClick={onAdmin}>Kelola produk <Icon name="arrow" size={17}/></button>}</div>}
    </section>
    <section className="bottom-cta"><div className="container bottom-cta-inner"><div><div className="eyebrow">PUNYA AKUN NUSAMARKET?</div><h2>Semua pesananmu, lebih mudah dipantau.</h2><p>Masuk untuk melihat riwayat transaksi dan status pesananmu.</p></div><div className="cta-decoration"><Icon name="package" size={74}/></div></div></section>
  </main>;
}

function AuthModal({ mode, setMode, onClose, onSubmit, busy, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e) => { e.preventDefault(); onSubmit({ name, email, password }); };
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="auth-modal modal-card"><button className="modal-close" onClick={onClose} aria-label="Tutup"><Icon name="close"/></button><div className="auth-brand"><span className="brand-mark"><Icon name="box" size={23}/></span><span>Nusa<span>Market</span></span></div><div className="auth-heading"><div className="eyebrow light-eyebrow">SELAMAT DATANG</div><h2>{mode === 'login' ? 'Masuk ke akunmu' : 'Buat akun baru'}</h2><p>{mode === 'login' ? 'Lanjutkan pengalaman belanjamu.' : 'Daftar sebagai pembeli dan mulai jelajahi produk.'}</p></div>
    <form onSubmit={submit} className="form-stack">{mode === 'register' && <label>Nama lengkap<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" minLength="2" required/></label>}<label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required/></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" minLength="6" required/></label>{error && <div className="form-error"><Icon name="alert" size={16}/>{error}</div>}<button className="primary-button full-button" type="submit" disabled={busy}>{busy ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar sekarang'} <Icon name="arrow" size={18}/></button></form>
    <div className="auth-switch">{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Daftar' : 'Masuk'}</button></div><p className="auth-footnote"><Icon name="shield" size={14}/> Password disimpan dengan proses hash pada server.</p></section></div>;
}

function ProductModal({ product, onClose, onAdd }) {
  if (!product) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="product-modal modal-card"><button className="modal-close" onClick={onClose} aria-label="Tutup"><Icon name="close"/></button><div className="product-modal-image"><img src={productImage(product.category)} alt={product.name}/></div><div className="product-modal-content"><span className="product-category-static">{product.category}</span><h2>{product.name}</h2><div className="modal-price">{money(product.price)}</div><p>{product.description || 'Produk pilihan untuk memenuhi kebutuhan sehari-hari.'}</p><div className="stock-line"><span className={Number(product.stock) > 0 ? 'stock-dot' : 'stock-dot out'}/>{Number(product.stock) > 0 ? `${product.stock} unit tersedia` : 'Stok habis'}</div><button className="primary-button full-button" disabled={Number(product.stock) < 1} onClick={() => { onAdd(product); onClose(); }}><Icon name="cart" size={18}/> Tambahkan ke keranjang</button><div className="product-modal-note"><Icon name="shield" size={16}/> Detail dan harga mengikuti data katalog.</div></div></section></div>;
}

function CartDrawer({ open, cart, onClose, onQty, onRemove, onCheckout, busy, paymentMethod, setPaymentMethod }) {
  if (!open) return null;
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  return <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><aside className="cart-drawer"><div className="drawer-header"><div><span className="eyebrow light-eyebrow">NUSAMARKET</span><h2>Keranjang belanja</h2><p>{cart.length} jenis produk</p></div><button className="modal-close" onClick={onClose} aria-label="Tutup keranjang"><Icon name="close"/></button></div>
    {cart.length ? <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><img src={productImage(item.category)} alt=""/><div className="cart-item-info"><strong>{item.name}</strong><span>{money(item.price)}</span><div className="quantity-control"><button onClick={() => onQty(item.id, item.quantity - 1)} aria-label="Kurangi"><Icon name="minus" size={14}/></button><span>{item.quantity}</span><button onClick={() => onQty(item.id, item.quantity + 1)} aria-label="Tambah"><Icon name="plus" size={14}/></button></div></div><button className="remove-item" onClick={() => onRemove(item.id)} aria-label="Hapus produk"><Icon name="trash" size={17}/></button></div>)}</div><div className="drawer-summary"><div className="summary-row"><span>Subtotal</span><strong>{money(total)}</strong></div><div className="summary-row muted"><span>Pengiriman</span><span>Dihitung terpisah</span></div><label className="payment-method-label">Metode pembayaran<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="BANK_TRANSFER">Transfer bank</option><option value="E_WALLET">E-wallet</option><option value="CREDIT_CARD">Kartu kredit</option></select></label><button className="primary-button full-button" onClick={onCheckout} disabled={busy}>{busy ? 'Memproses pesanan...' : 'Lanjut ke checkout'} <Icon name="arrow" size={18}/></button><p><Icon name="shield" size={14}/> Checkout menggunakan data produk dan stok dari server.</p></div></> : <div className="empty-state cart-empty"><span className="empty-icon"><Icon name="cart" size={27}/></span><h3>Keranjang masih kosong</h3><p>Tambahkan produk yang kamu inginkan ke keranjang.</p><button className="secondary-button" onClick={onClose}>Lanjut belanja</button></div>}
  </aside></div>;
}

const statusLabels = { PENDING_PAYMENT: 'Menunggu pembayaran', PAID: 'Dibayar', PROCESSING: 'Diproses', SHIPPED: 'Dikirim', COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan', PENDING: 'Menunggu konfirmasi', FAILED: 'Gagal' };
const statusClass = (status) => String(status || '').toLowerCase().replaceAll('_', '-');

function OrderPage({ orders, loading, error, onRefresh, onPay, onPaymentMethod, busyPayment, user }) {
  const [methods, setMethods] = useState({});
  return <main className="inner-page container"><div className="page-heading"><div><div className="eyebrow light-eyebrow">AKUN NUSAMARKET</div><h1>Pesanan saya</h1><p>Pantau transaksi dan status pesananmu di sini.</p></div><button className="secondary-button" onClick={onRefresh}><Icon name="refresh" size={17}/> Perbarui</button></div>
    {loading ? <div className="page-loading">Memuat riwayat pesanan...</div> : error ? <div className="empty-state"><span className="empty-icon"><Icon name="alert"/></span><h3>Pesanan belum dapat dimuat</h3><p>{error}</p><button className="secondary-button" onClick={onRefresh}>Coba lagi</button></div> : orders.length ? <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-head"><div><span className="order-number">ORDER #{String(order.id).padStart(5, '0')}</span><span className="order-date">{formatDate(order.created_at)}</span></div><span className={`status-pill ${statusClass(order.status)}`}>{statusLabels[order.status] || order.status}</span></div><div className="order-card-items">{(order.items || []).map((item) => <div className="order-line" key={item.id}><div><strong>{item.product_name}</strong><span>{item.quantity} × {money(item.price)}</span></div><strong>{money(item.subtotal)}</strong></div>)}</div><div className="order-card-foot"><div><span>Total pesanan</span><strong>{money(order.total)}</strong>{order.payment && <small>Ref: {order.payment.reference} · {statusLabels[order.payment.status] || order.payment.status}</small>}</div><div className="order-actions">{order.status === 'PENDING_PAYMENT' && !order.payment && <><select value={methods[order.id] || 'BANK_TRANSFER'} onChange={(e) => setMethods((prev) => ({ ...prev, [order.id]: e.target.value }))} aria-label="Metode pembayaran"><option value="BANK_TRANSFER">Transfer bank</option><option value="E_WALLET">E-wallet</option><option value="CREDIT_CARD">Kartu kredit</option></select><button className="primary-button small-button" disabled={busyPayment === order.id} onClick={() => onPay(order.id, methods[order.id] || 'BANK_TRANSFER')}>{busyPayment === order.id ? 'Memproses...' : 'Buat pembayaran'}</button></>}{order.status === 'PENDING_PAYMENT' && order.payment?.status === 'PENDING' && <span className="waiting-note">Menunggu konfirmasi admin</span>}</div></div></article>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="package" size={27}/></span><h3>Belum ada pesanan</h3><p>Pesanan yang kamu buat akan muncul di halaman ini.</p><button className="primary-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Mulai belanja <Icon name="arrow" size={17}/></button></div>}
  </main>;
}

function ProductForm({ initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState({ name: initial?.name || '', category: initial?.category || 'Elektronik', price: initial?.price || '', stock: initial?.stock ?? 1, description: initial?.description || '' });
  const change = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return <form className="admin-product-form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, price: Number(form.price), stock: Number(form.stock) }); }}><div className="form-grid"><label>Nama produk<input value={form.name} onChange={(e) => change('name', e.target.value)} maxLength="150" required placeholder="Contoh: Headphone Wireless"/></label><label>Kategori<input value={form.category} onChange={(e) => change('category', e.target.value)} maxLength="100" required placeholder="Contoh: Audio"/></label><label>Harga (Rp)<input type="number" min="0" step="1000" value={form.price} onChange={(e) => change('price', e.target.value)} required placeholder="250000"/></label><label>Stok<input type="number" min="0" step="1" value={form.stock} onChange={(e) => change('stock', e.target.value)} required/></label><label className="full-field">Deskripsi<textarea rows="3" value={form.description} onChange={(e) => change('description', e.target.value)} placeholder="Jelaskan produk secara singkat..."/></label></div><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Batal</button><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Menyimpan...' : initial ? 'Simpan perubahan' : 'Tambah produk'} <Icon name="arrow" size={17}/></button></div></form>;
}

function AdminPage({ products, orders, onRefresh, onProductSave, onProductDelete, onOrderStatus, onConfirmPayment, busyAction }) {
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const paidTotal = orders.filter((order) => ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(order.status)).reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pending = orders.filter((order) => order.status === 'PENDING_PAYMENT').length;
  const lowStock = products.filter((product) => Number(product.stock) <= 5).length;
  const nextStatus = { PAID: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'COMPLETED' };
  const saveProduct = async (data) => { setFormBusy(true); try { await onProductSave(data, editing?.id); setShowForm(false); setEditing(null); } catch (_error) { /* Error is shown by the parent toast; keep the form open. */ } finally { setFormBusy(false); } };
  return <main className="inner-page container admin-page"><div className="page-heading"><div><div className="eyebrow light-eyebrow">PUSAT KONTROL</div><h1>Admin dashboard</h1><p>Kelola katalog produk, pesanan, dan pembayaran.</p></div><button className="secondary-button" onClick={onRefresh}><Icon name="refresh" size={17}/> Perbarui data</button></div>
    <div className="admin-tabs"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}><Icon name="grid" size={17}/> Ringkasan</button><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Icon name="package" size={17}/> Produk <span>{products.length}</span></button><button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><Icon name="cart" size={17}/> Pesanan <span>{orders.length}</span></button></div>
    {tab === 'overview' && <><div className="stats-grid"><div className="stat-card"><span className="stat-icon blue"><Icon name="package"/></span><small>Total produk</small><strong>{products.length}</strong><span>Produk dalam katalog</span></div><div className="stat-card"><span className="stat-icon orange"><Icon name="cart"/></span><small>Total pesanan</small><strong>{orders.length}</strong><span>Seluruh transaksi</span></div><div className="stat-card"><span className="stat-icon purple"><Icon name="credit"/></span><small>Menunggu pembayaran</small><strong>{pending}</strong><span>Perlu dipantau</span></div><div className="stat-card"><span className="stat-icon green"><Icon name="chart"/></span><small>Nilai pesanan dibayar</small><strong>{money(paidTotal)}</strong><span>Akumulasi status dibayar ke atas</span></div></div><div className="admin-overview-grid"><section className="admin-panel"><div className="panel-heading"><div><h3>Pesanan terbaru</h3><p>Aktivitas transaksi terakhir</p></div><button className="text-button" onClick={() => setTab('orders')}>Lihat semua <Icon name="arrow" size={15}/></button></div>{orders.slice(0, 5).length ? orders.slice(0, 5).map((order) => <div className="recent-order" key={order.id}><div className="recent-order-icon"><Icon name="package" size={18}/></div><div><strong>Order #{String(order.id).padStart(5, '0')}</strong><small>{formatDate(order.created_at)}</small></div><div className="recent-order-right"><strong>{money(order.total)}</strong><span className={`status-pill ${statusClass(order.status)}`}>{statusLabels[order.status] || order.status}</span></div></div>) : <p className="panel-empty">Belum ada transaksi.</p>}</section><section className="admin-panel inventory-panel"><div className="panel-heading"><div><h3>Perhatian inventori</h3><p>Produk dengan stok terbatas</p></div><span className="inventory-count">{lowStock}</span></div>{products.filter((product) => Number(product.stock) <= 5).slice(0, 6).map((product) => <div className="inventory-row" key={product.id}><img src={productImage(product.category)} alt=""/><div><strong>{product.name}</strong><small>{product.category}</small></div><span className={Number(product.stock) === 0 ? 'stock-critical' : 'stock-warning'}>{product.stock} tersisa</span></div>)}{lowStock === 0 && <div className="inventory-clear"><Icon name="check" size={20}/> Semua stok berada di atas batas minimum.</div>}</section></div></>}
    {tab === 'products' && <section className="admin-panel table-panel"><div className="panel-heading"><div><h3>Manajemen produk</h3><p>Tambah, ubah, atau hapus produk katalog.</p></div><button className="primary-button small-button" onClick={() => { setEditing(null); setShowForm(true); }}><Icon name="plus" size={17}/> Tambah produk</button></div>{showForm && <div className="form-panel"><h4>{editing ? 'Edit produk' : 'Produk baru'}</h4><ProductForm initial={editing} busy={formBusy} onCancel={() => { setShowForm(false); setEditing(null); }} onSave={saveProduct}/></div>}<div className="table-wrap"><table><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><img src={productImage(product.category)} alt=""/><strong>{product.name}</strong></div></td><td>{product.category}</td><td className="table-price">{money(product.price)}</td><td><span className={Number(product.stock) <= 5 ? 'stock-warning' : 'stock-normal'}>{product.stock}</span></td><td><div className="table-actions"><button onClick={() => { setEditing(product); setShowForm(true); }} title="Edit"><Icon name="edit" size={16}/></button><button className="danger-action" onClick={() => onProductDelete(product.id)} title="Hapus"><Icon name="trash" size={16}/></button></div></td></tr>)}</tbody></table>{!products.length && <p className="panel-empty">Belum ada produk di katalog.</p>}</div></section>}
    {tab === 'orders' && <section className="admin-panel table-panel"><div className="panel-heading"><div><h3>Manajemen pesanan</h3><p>Periksa pembayaran dan perbarui status pemrosesan.</p></div></div><div className="table-wrap"><table><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Pembayaran</th><th>Aksi</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>#{String(order.id).padStart(5, '0')}</strong><small className="table-sub">{formatDate(order.created_at)}</small></td><td>User #{order.user_id}</td><td className="table-price">{money(order.total)}</td><td><span className={`status-pill ${statusClass(order.status)}`}>{statusLabels[order.status] || order.status}</span></td><td>{order.payment ? <span className={`status-pill ${statusClass(order.payment.status)}`}>{statusLabels[order.payment.status] || order.payment.status}</span> : <span className="muted-text">Belum dibuat</span>}</td><td><div className="admin-row-actions">{order.payment?.status === 'PENDING' && <button className="small-action confirm-action" disabled={busyAction === `pay-${order.payment.id}`} onClick={() => onConfirmPayment(order.payment.id)}>Konfirmasi bayar</button>}{order.status === 'PENDING_PAYMENT' && <button className="small-action cancel-action" disabled={busyAction === `order-${order.id}`} onClick={() => onOrderStatus(order.id, 'CANCELLED')}>Batalkan</button>}{nextStatus[order.status] && <button className="small-action" disabled={busyAction === `order-${order.id}`} onClick={() => onOrderStatus(order.id, nextStatus[order.status])}>{nextStatus[order.status] === 'PROCESSING' ? 'Proses' : nextStatus[order.status] === 'SHIPPED' ? 'Kirim' : 'Selesaikan'}</button>}</div></td></tr>)}</tbody></table>{!orders.length && <p className="panel-empty">Belum ada pesanan.</p>}</div></section>}
  </main>;
}

function Footer() {
  return <footer className="site-footer"><div className="container footer-main"><div><Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}/><p>Platform e-commerce sederhana dengan layanan terpisah untuk pengalaman belanja yang terstruktur.</p></div><div><strong>Jelajahi</strong><span>Katalog produk</span><span>Pesanan saya</span></div><div><strong>Layanan</strong><span>User Service</span><span>Product Service</span><span>Order & Payment</span></div><div><strong>Informasi</strong><span>Proyek INF300</span><span>Kelompok VI</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} NusaMarket. Proyek akademik Kelompok VI.</span><span>Built with Microservices Architecture</span></div></footer>;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [page, setPage] = useState('home');
  const [token, setToken] = useState(() => readStorage('nusa_token', '') || '');
  const [user, setUser] = useState(() => { try { return JSON.parse(readStorage('nusa_user', 'null') || 'null'); } catch { return null; } });
  const [cart, setCart] = useState(() => { try { return JSON.parse(readStorage('nusa_cart', '[]') || '[]'); } catch { return []; } });
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState('BANK_TRANSFER');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [busyPayment, setBusyPayment] = useState(null);
  const [busyAction, setBusyAction] = useState('');

  const notify = useCallback((message, type = 'success') => { setToast({ message, type }); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => setToast(null), 4200); }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true); setProductsError('');
    try { const response = await api('/products?limit=100'); setProducts(response.data || []); }
    catch (error) { setProductsError(error.message); }
    finally { setProductsLoading(false); }
  }, []);

  const clearSession = useCallback(() => { setToken(''); setUser(null); removeStorage('nusa_token'); removeStorage('nusa_user'); setOrders([]); setPage('home'); }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { writeStorage('nusa_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (!token) return;
    api('/users/me', { token }).then((response) => { const profile = response.data; setUser(profile); writeStorage('nusa_user', JSON.stringify(profile)); }).catch((error) => { if (error.status === 401) clearSession(); });
  }, [token, clearSession]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true); setOrdersError('');
    try {
      const response = await api('/orders', { token });
      const list = response.data || [];
      const enriched = await Promise.all(list.map(async (order) => {
        try {
          const detail = await api(`/orders/${order.id}`, { token });
          let payment = null;
          try { payment = (await api(`/payments/order/${order.id}`, { token })).data; } catch (error) { if (error.status !== 404) throw error; }
          return { ...detail.data, payment };
        } catch (error) { return { ...order, payment: null, _loadError: error.message }; }
      }));
      setOrders(enriched);
    } catch (error) { setOrdersError(error.message); if (error.status === 401) clearSession(); }
    finally { setOrdersLoading(false); }
  }, [token, clearSession]);

  useEffect(() => { if (token && (page === 'orders' || page === 'admin')) loadOrders(); }, [token, page, loadOrders]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const addToCart = (product) => {
    if (Number(product.stock) < 1) return notify('Stok produk sedang habis.', 'error');
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, Number(product.stock)) } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    notify(`${product.name} ditambahkan ke keranjang.`);
  };
  const updateCartQty = (id, quantity) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(0, Math.min(quantity, Number(item.stock))) } : item).filter((item) => item.quantity > 0));
  const removeCartItem = (id) => setCart((current) => current.filter((item) => item.id !== id));

  const handleAuth = async ({ name, email, password }) => {
    setAuthBusy(true); setAuthError('');
    try {
      if (authMode === 'register') {
        await api('/users/register', { method: 'POST', body: { name, email, password } });
      }
      const response = await api('/users/login', { method: 'POST', body: { email, password } });
      const nextToken = response.data.token;
      const nextUser = response.data.user;
      setToken(nextToken); setUser(nextUser); writeStorage('nusa_token', nextToken); writeStorage('nusa_user', JSON.stringify(nextUser));
      setAuthOpen(false); setAuthError('');
      notify(authMode === 'register' ? 'Akun berhasil dibuat. Selamat datang!' : 'Berhasil masuk ke NusaMarket.');
      if (nextUser.role === 'admin') setPage('admin');
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  };

  const handleCheckout = async () => {
    if (!token) { setCartOpen(false); setAuthMode('login'); setAuthOpen(true); notify('Masuk terlebih dahulu untuk melanjutkan checkout.', 'error'); return; }
    if (!cart.length) return;
    setCheckoutBusy(true);
    try {
      const response = await api('/orders', { method: 'POST', token, body: { items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })) } });
      const order = response.data;
      setCart([]); setCartOpen(false); setPage('orders');
      try {
        const payment = await api('/payments', { method: 'POST', token, body: { order_id: order.id, payment_method: checkoutMethod } });
        notify(`Pesanan #${order.id} dibuat. Ref pembayaran: ${payment.data.reference}. Menunggu konfirmasi admin.`);
      } catch (paymentError) { notify(`Pesanan #${order.id} berhasil dibuat. Pembayaran belum dibuat: ${paymentError.message}`, 'error'); }
      await loadProducts();
      await loadOrders();
    } catch (error) { notify(error.message, 'error'); }
    finally { setCheckoutBusy(false); }
  };

  const handlePayOrder = async (orderId, paymentMethod) => {
    setBusyPayment(orderId);
    try { const response = await api('/payments', { method: 'POST', token, body: { order_id: orderId, payment_method: paymentMethod } }); notify(`Instruksi pembayaran dibuat: ${response.data.reference}. Menunggu konfirmasi admin.`); await loadOrders(); }
    catch (error) { notify(error.message, 'error'); }
    finally { setBusyPayment(null); }
  };

  const refreshAdmin = async () => { await Promise.all([loadProducts(), loadOrders()]); };
  const saveProduct = async (data, id) => {
    try { await api(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', token, body: data }); notify(id ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.'); await loadProducts(); }
    catch (error) { notify(error.message, 'error'); throw error; }
  };
  const deleteProduct = async (id) => {
    if (!window.confirm('Hapus produk ini dari katalog?')) return;
    try { await api(`/products/${id}`, { method: 'DELETE', token }); notify('Produk berhasil dihapus.'); await loadProducts(); }
    catch (error) { notify(error.message, 'error'); }
  };
  const updateOrderStatus = async (id, status) => {
    const label = statusLabels[status] || status;
    if (!window.confirm(`Ubah status pesanan #${id} menjadi "${label}"?`)) return;
    setBusyAction(`order-${id}`);
    try { await api(`/orders/${id}/status`, { method: 'PUT', token, body: { status } }); notify(`Status pesanan #${id} diperbarui.`); await loadOrders(); }
    catch (error) { notify(error.message, 'error'); }
    finally { setBusyAction(''); }
  };
  const confirmPayment = async (id) => {
    setBusyAction(`pay-${id}`);
    try { await api(`/payments/${id}/confirm`, { method: 'POST', token }); notify('Pembayaran dikonfirmasi dan status pesanan diperbarui.'); await loadOrders(); }
    catch (error) { notify(error.message, 'error'); }
    finally { setBusyAction(''); }
  };

  const setCurrentPage = (target) => { if (target === 'orders' && !token) { setAuthMode('login'); setAuthOpen(true); return; } if (target === 'admin' && user?.role !== 'admin') { notify('Halaman ini hanya dapat diakses admin.', 'error'); return; } setPage(target); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return <div className="app-shell">
    <Header user={user} cartCount={cartCount} search={search} setSearch={setSearch} onCart={() => setCartOpen(true)} onAuth={() => { setAuthMode('login'); setAuthError(''); setAuthOpen(true); }} onLogout={() => { clearSession(); notify('Kamu sudah keluar.'); }} page={page} setPage={setCurrentPage}/>
    {page === 'home' && <HomePage products={products} loading={productsLoading} error={productsError} search={search} category={category} setCategory={setCategory} onOpen={setSelectedProduct} onAdd={addToCart} onRetry={loadProducts} user={user} onAdmin={() => setCurrentPage('admin')}/>}
    {page === 'orders' && <OrderPage orders={orders} loading={ordersLoading} error={ordersError} onRefresh={loadOrders} onPay={handlePayOrder} busyPayment={busyPayment} user={user}/>}
    {page === 'admin' && user?.role === 'admin' && <AdminPage products={products} orders={orders} onRefresh={refreshAdmin} onProductSave={saveProduct} onProductDelete={deleteProduct} onOrderStatus={updateOrderStatus} onConfirmPayment={confirmPayment} busyAction={busyAction}/>}
    <Footer/>
    <Toast toast={toast} onClose={() => setToast(null)}/>
    {authOpen && <AuthModal mode={authMode} setMode={(mode) => { setAuthMode(mode); setAuthError(''); }} onClose={() => setAuthOpen(false)} onSubmit={handleAuth} busy={authBusy} error={authError}/>}
    {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart}/>}
    <CartDrawer open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} onQty={updateCartQty} onRemove={removeCartItem} onCheckout={handleCheckout} busy={checkoutBusy} paymentMethod={checkoutMethod} setPaymentMethod={setCheckoutMethod}/>
  </div>;
}

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Adisyon POS - Restaurant Yönetim Sistemi

Bu proje Electron + React + TypeScript kullanarak geliştirilmiş modern bir restaurant yönetim sistemidir.

## Proje Yapısı

- **src/main/**: Electron main process (SQLite veritabanı, IPC handlers)
- **src/renderer/**: React frontend (UI, Redux store, sayfalar)
- **src/preload/**: Electron preload scripts (güvenli API bridge)
- **src/shared/**: Ortak tipler ve servisler

## Teknoloji Stack

- Frontend: React 18, TypeScript, Vanilla CSS (utility classes), Redux Toolkit
- Desktop: Electron
- Database: SQLite (local), MongoDB (cloud)
- Icons: Heroicons
- Build: Vite

## Ana Modüller

1. **Masa Yönetimi**: Masa düzeni, durumları (müsait, dolu, rezerve, temizlik)
2. **Menü & Ürünler**: Kategori bazlı ürün yönetimi, fiyatlandırma
3. **Sipariş Yönetimi**: Sipariş alma, durum takibi, mutfak bildirimleri
4. **Kasa & Ödemeler**: Nakit/kart/mobil ödeme, adisyon yazdırma

## Mimari Özellikler

- Multi-tenant yapı (cloud MongoDB + local SQLite)
- Offline çalışma desteği
- Lisans tabanlı yetkilendirme
- Real-time senkronizasyon
- Restaurant bazlı tenant yönetimi

## Geliştirme Kılavuzu

- Component'ler functional olmalı ve TypeScript kullanmalı
- Redux Toolkit ile state yönetimi
- Vanilla CSS utility classes ile styling (index.css'te tanımlı)
- Responsive tasarım (dokunmatik ekran desteği)
- IPC communication güvenli şekilde preload script üzerinden
- Error handling ve loading states
- Modern UI/UX patterns

## Çalıştırma Komutları

```bash
# Geliştirme ortamı (2 terminal gerektir)
npm run dev:renderer  # Terminal 1: React dev server
npm run dev:main      # Terminal 2: Electron uygulaması

# Veya tek komutla (önerilen)
npm run dev

# Üretim için derleme
npm run build

# Sadece Electron başlatma (build sonrası)
npm start
```

## CSS Utility Classes

Projede kullanılan başlıca CSS class'ları:
- Layout: `flex`, `grid`, `w-full`, `h-full`
- Spacing: `p-4`, `m-2`, `space-x-4`
- Colors: `bg-blue-600`, `text-white`, `border-green-500`
- Buttons: `btn-primary`, `btn-success`, `btn-secondary`
- Grid: `grid-cols-4`, `gap-4`
- Responsive: `md:grid-cols-2`, `lg:grid-cols-3`

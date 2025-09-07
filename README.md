# Adisyon POS - Restaurant Yönetim Sistemi

Modern restaurant yönetimi için tasarlanmış masaüstü uygulama. Electron + React + TypeScript ile geliştirilmiştir.

## 🏗️ Mimari

### Multi-Tenant Yapı
- **Cloud Database (MongoDB)**: Tenant yönetimi, lisans takibi, merkezi raporlama
- **Local Database (SQLite)**: Restaurant içi operasyonlar, offline çalışma
- **Desktop App (Electron)**: Kullanıcı arayüzü ve local işlemler

### Ana Modüller
1. **Masa Yönetimi**: Masa düzeni, durumları, rezervasyonlar
2. **Menü & Ürünler**: Kategori bazlı ürün yönetimi, fiyatlandırma
3. **Sipariş Yönetimi**: Sipariş alma, mutfak bildirimleri, durum takibi
4. **Kasa & Ödemeler**: Nakit/kart ödemeleri, adisyon yazdırma, raporlama

## 🛠️ Teknoloji Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron
- **State Management**: Redux Toolkit
- **Local Database**: SQLite3
- **Cloud Database**: MongoDB Atlas
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Build Tool**: Vite

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v16+)
- npm veya yarn

### Kurulum
```bash
# Bağımlılıkları yükle
npm install

# Geliştirme ortamını başlat
npm run dev

# Üretim için derle
npm run build

# Elektron uygulamasını paketle
npm run package
```

### Geliştirme Komutları
```bash
# Renderer (React) geliştirme sunucusu
npm run dev:renderer

# Main process geliştirme
npm run dev:main

# Her ikisini birlikte çalıştır
npm run dev
```

## 📁 Proje Yapısı

```
adisyon/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # Ana Electron dosyası
│   │   └── database/   # SQLite veritabanı yönetimi
│   ├── preload/        # Electron preload scripts
│   ├── renderer/       # React frontend
│   │   ├── components/ # UI komponetleri
│   │   ├── pages/      # Sayfa komponetleri
│   │   ├── store/      # Redux store ve slice'lar
│   │   └── App.tsx     # Ana React komponenti
│   └── shared/         # Ortak tipler ve servisler
├── database/           # SQLite veritabanı dosyaları
├── dist/              # Derlenmiş dosyalar
└── package.json
```

## 🔧 Özellikler

### Masa Yönetimi
- Görsel masa düzeni
- Masa durumları (Müsait, Dolu, Rezerve, Temizlik)
- Masa kapasitesi yönetimi
- Hızlı masa seçimi

### Menü Yönetimi
- Kategori bazlı ürün organizasyonu
- Fiyat yönetimi
- Ürün görsel desteği
- Stok durumu takibi

### Sipariş Sistemi
- Hızlı sipariş alma
- Mutfak bildirimleri
- Sipariş durum takibi
- Not ekleme özelliği

### Ödeme Sistemi
- Nakit/Kart/Mobil ödeme
- Para üstü hesaplama
- Adisyon yazdırma
- Günlük rapor

### Cloud Entegrasyonu
- Lisans doğrulama
- Merkezi veri senkronizasyonu
- Multi-tenant yapı
- Offline çalışma desteği

## 🔐 Lisans Yönetimi

Uygulama cloud tabanlı lisans sistemi kullanır:
- Restaurant kayıt ve doğrulama
- Lisans süresi takibi
- Özellik bazlı erişim kontrolü
- Otomatik lisans yenileme

## 🌐 Cloud API Endpoints

```
POST /api/auth/validate     # Lisans doğrulama
GET  /api/license/:id       # Lisans bilgileri
POST /api/sync/upload       # Veri yükleme
GET  /api/sync/download/:id # Veri indirme
POST /api/reports/daily     # Günlük rapor
GET  /api/health           # Sistem durumu
```

## 🔄 Veri Senkronizasyonu

- **Real-time**: Kritik operasyonlar anında senkronize
- **Batch**: Toplu veri transferi belirli aralıklarla
- **Offline Support**: İnternet bağlantısı olmadığında local çalışma
- **Conflict Resolution**: Çakışma durumlarında akıllı çözüm

## 🎨 UI/UX

- Modern ve responsive tasarım
- Dokunmatik ekran desteği
- Hızlı erişim kısayolları
- Renk kodlu durum göstergeleri
- Animasyonlu geçişler

## 🚧 Geliştirme Notları

- TypeScript strict mode aktif
- ESLint ve Prettier kullanımı
- Hot reload geliştirme desteği
- Otomatik test entegrasyonu (planlanıyor)
- CI/CD pipeline (planlanıyor)

## 📝 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 İletişim

Proje hakkında sorularınız için GitHub Issues kullanın.

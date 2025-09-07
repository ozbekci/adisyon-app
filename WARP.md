# WARP.md

Bu dosya, WARP (warp.dev) aracının bu depoda kod geliştirirken kullanacağı rehberdir.

## Proje Genel Bakış

**Adisyon POS**, modern restoran yönetimi için geliştirilmiş masaüstü uygulamasıdır. Electron + React + TypeScript ile multi-tenant yapıda inşa edilmiştir. Hem local (SQLite/PostgreSQL) hem cloud (MongoDB) veritabanı desteği sunarak offline çalışma ve merkezi senkronizasyon imkânı sağlar.

## Teknoloji Stack'i

- **Desktop Framework**: Electron 37.2.0
- **Frontend**: React 19.1.0 + TypeScript 5.8.3
- **State Management**: Redux Toolkit 2.8.2
- **Routing**: React Router DOM 7.6.3
- **Database**: PostgreSQL (pg 8.16.3) / SQLite3 (fallback)
- **UI Framework**: Tailwind CSS + DaisyUI
- **Icons**: Heroicons
- **Build Tool**: Vite 6.3.5
- **Real-time**: Socket.io 4.8.1
- **Authentication**: JWT + bcrypt

## Yaygın Komutlar

### Geliştirme
```bash
# Tüm uygulamayı geliştirme modunda başlat
npm run dev

# Sadece renderer (React) geliştirme sunucusu
npm run dev:renderer

# Sadece main process geliştirme
npm run dev:main

# Bağımlılıkları yükle
npm install
```

### Build & Package
```bash
# Tüm komponetleri derle
npm run build

# Renderer build (React frontend)
npm run build:renderer

# Main process build
npm run build:main  

# Preload script build
npm run build:preload

# Electron uygulamasını paketle
npm run package

# Derlenmiş uygulamayı çalıştır
npm start
```

### Geliştirme & Debug
```bash
# PostgreSQL bağlantı debug aktifleştir
$env:DEBUG_DB = '1'; npm run dev

# Veritabanı bağlantı string'i belirle
$env:PG_CONNECTION_STRING = 'postgresql://user:pass@host:port/dbname'
```

## Proje Mimarisi

### Electron Multi-Process Yapısı
- **Main Process** (`src/main/`): Veritabanı yönetimi, IPC handlers, güvenlik
- **Renderer Process** (`src/renderer/`): React UI, Redux store, kullanıcı etkileşimi
- **Preload Scripts** (`src/preload/`): Güvenli main/renderer köprüsü

### Veritabanı Katmanları
- **DatabaseManager** (`src/main/database/DatabaseManager.ts`): Ana veritabanı sınıfı
- **Domain Modules** (`src/main/database/domains/`): İş mantığı modülleri
  - `users.ts` - Kullanıcı yönetimi, authentication
  - `orders.ts` - Sipariş CRUD, durum yönetimi
  - `menu.ts` - Menü öğeleri ve kategoriler
  - `tables.ts` - Masa yönetimi
  - `customers.ts` - Müşteri veritabanı
  - `waiters.ts` - Garson sistemi
  - `features.ts` - Özellik bayrakları
  - `cashSessions.ts` - Kasa seansları
  - `reporting.ts` - Rapor ve analitik

### Frontend Yapısı
- **Pages** (`src/renderer/pages/`): Ana sayfa komponetleri
- **Components** (`src/renderer/components/`): Yeniden kullanılabilir UI parçaları
- **Store** (`src/renderer/store/`): Redux state yönetimi
- **Shared** (`src/shared/`): Ortak tipler ve servisler

### IPC İletişim Modeli
1. **Database Method**: Domain'de iş mantığı implement edilir
2. **IPC Handler**: `main.ts`'te `ipcMain.handle('kanal-ismi', ...)` ile kayıt edilir
3. **Preload Exposure**: `preload.ts`'te `contextBridge.exposeInMainWorld` ile güvenli API oluşturulur
4. **Renderer Call**: React komponetlerinde `window.electronAPI.methodName()` ile çağrılır

### Veritabanı Şeması (PostgreSQL)
- **orders** - Siparişler ve durum takibi (version kontrolü ile optimistic locking)
- **order_items** - Sipariş detay satırları
- **order_history** - Tamamlanmış siparişler 
- **tables** - Masalar ve konum bilgileri
- **table_categories** - Masa kategorileri (renk kodlu)
- **menu_items** - Menü öğeleri (soft delete desteği)
- **menu_categories** - Menü kategorileri
- **users** - Kullanıcılar (bcrypt hash'li şifreler)
- **customers** - Müşteri kayıtları
- **cash_sessions** - Kasa açma/kapama seansları
- **features** - Sistem özellik bayrakları

## Temel İş Akışları

### Sipariş Yönetimi Akışı
1. **Masa Seçimi**: TablesPage'de masa durumu görüntüleme
2. **Sipariş Alma**: OrdersPage'de menü seçimi ve sepet yönetimi
3. **Mutfak Bildirimi**: Socket.io ile real-time sipariş iletimi
4. **Durum Takibi**: pending → preparing → ready → served → paid
5. **Ödeme**: CashPage'de nakit/kart ödeme işlemleri

### Kullanıcı Authentication
1. **Login**: Kullanıcı adı/şifre ile bcrypt doğrulama
2. **Session**: JWT token tabanlı oturum yönetimi
3. **Role-based Access**: manager/cashier/waiter rol bazlı yetkilendirme
4. **Redux Store**: authSlice ile global kullanıcı durumu

### Masa Yönetimi
1. **Kategorizasyon**: Renk kodlu masa grupları
2. **Durumlar**: available/occupied/reserved/cleaning
3. **Görsel Layout**: Drag-drop ile masa yerleşimi
4. **Real-time Updates**: Socket.io ile anlık durum senkronizasyonu

## Geliştirme Kuralları

### Naming Conventions (Copilot Instructions'dan)
- **IPC Channels**: kebab-case (`get-menu-items`, `create-order`)
- **Database Methods**: camelCase (`getMenuItems`, `createOrder`)
- **Preload Methods**: renderer ile aynı (`getMenuItems`)
- **React Components**: PascalCase (`MenuPage`, `OrdersPage`)

### Veritabanı Geliştirme Süreci
1. **Domain Method**: `src/main/database/domains/` altında iş mantığı implement et
2. **IPC Registration**: `main.ts`'te handle ekle
3. **Preload Exposure**: `preload.ts`'te güvenli API oluştur
4. **Type Safety**: Parametreli sorgular (`$1, $2`) kullan, SQL injection'a karşı koru
5. **Transaction**: Kritik işlemler için `withTransaction()` kullan

### UI/UX Desenleri
- **Glass Morphism**: `.card` ve `.glass` sınıfları ile modern cam efekti
- **Role-based UI**: Sidebar'da kullanıcı rolüne göre menü filtreleme
- **Responsive**: Tailwind breakpoint'leri ile adaptif tasarım
- **Loading States**: Redux loading state'leri ile kullanıcı deneyimi
- **Error Handling**: Try-catch blokları ile hata yönetimi

### State Management Desenleri
- **Redux Slices**: Her domain için ayrı slice (authSlice, orderSlice, etc.)
- **Async Thunks**: Veritabanı işlemleri için async action'lar
- **Optimistic Updates**: UI performansı için iyimser güncellemeler
- **Error States**: Hata durumları için consistent pattern

## Özel Dikkat Edilecek Noktalar

### Güvenlik
- **Password Hashing**: bcrypt ile güçlü şifreleme
- **SQL Injection**: Parametreli sorgular zorunlu
- **XSS Protection**: React'ın built-in koruması
- **IPC Security**: contextBridge ile güvenli API exposure

### Performance
- **Database Indexing**: Kritik sorgular için index tanımları
- **Connection Pooling**: PostgreSQL connection yönetimi
- **Memory Management**: Electron process'leri için memory cleanup
- **Bundle Optimization**: Vite ile code splitting

### Multi-tenant Considerations
- **Database Isolation**: Her restaurant için ayrı schema/database
- **License Validation**: Cloud API ile lisans kontrolü
- **Data Sync**: Offline çalışma ve merkezi senkronizasyon
- **Feature Flags**: Tenant bazlı özellik kontrolü

### Error Handling Patterns
```typescript
// Database operations
try {
  const result = await this.get('SELECT * FROM table WHERE id = $1', [id]);
  if (!result) throw new Error('Kayıt bulunamadı');
  return result;
} catch (error) {
  console.error('Database error:', error);
  throw error;
}
```

### Common Debugging Scenarios
- **"Cannot connect to database"**: PostgreSQL bağlantı string'ini kontrol et
- **"Method not found on electronAPI"**: Preload exposure'ı kontrol et
- **"IPC handler missing"**: `main.ts`'te handle kayıtlı mı kontrol et
- **"Turkish characters broken"**: UTF-8 encoding ve Türkiye timezone ayarları

### Development Environment Setup
- PostgreSQL server gerekli (default: localhost:5432)
- Node.js 16+ ve npm/yarn
- Visual Studio Code önerilen (Electron/React extensionları ile)
- Database GUI tool (pgAdmin, DBeaver) önerilen

### Best Practices
- Her yeni özellik için önce domain method, sonra IPC, son olarak UI
- Database değişiklikleri için migration pattern kullan
- Component'lerde loading ve error state'leri mutlaka handle et
- Turkish localizations tutarlı kullan
- Git commit'lerde anlamlı mesajlar (Türkçe kabul edilir)

## Dosya Yapısı İçgörüleri

```
src/
├── main/                   # Electron main process
│   ├── main.ts            # Ana Electron dosyası, IPC handlers
│   └── database/          # Veritabanı katmanı
│       ├── DatabaseManager.ts  # Ana DB sınıfı
│       └── domains/       # İş mantığı modülleri
├── preload/               # Güvenli IPC köprüsü
├── renderer/              # React frontend
│   ├── pages/            # Sayfa komponetleri
│   ├── components/       # UI komponetleri
│   ├── store/            # Redux state
│   └── App.tsx           # Ana React component
└── shared/               # Ortak tipler
```

Bu yapı, clean architecture prensiplerine uygun şekilde separation of concerns sağlar ve maintainable kod yazmayı destekler.

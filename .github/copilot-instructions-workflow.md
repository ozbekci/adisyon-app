# Copilot Custom Workflow Instructions

## Electron + SQLite + React Dev Routine

1. **Database Access**
   - Yeni sayfa/özellik için `m-databasemanager.ts`'e method ekle.
   - `this.get()`, `this.all()`, `this.run()` kullan.
   - Gerekirse transaction (`BEGIN TRANSACTION`/`COMMIT`).
   - Parametreli sorgu (`?`) ile SQL injection engelle.
   - Dönüş tipleri type-safe olmalı (`Promise<Type[]>` veya `Promise<Type>`).

2. **IPC Connection**
   - Her yeni DB methodunu `main.ts`'te `ipcMain.handle('kanal', ...)` ile kaydet.
   - Kanal isimleri kebab-case ve açıklayıcı olmalı.

3. **Preload Expose**
   - `preload.ts`'te `contextBridge.exposeInMainWorld` ile fonksiyonu dışarı aç.
   - Exposed method ismi ve kanal ismi birebir eşleşmeli.

4. **Renderer Call**
   - React component'te `window.electronAPI.method(args)` ile çağır.

5. **Yeni Pencere**
   - Yeni sayfa gerekiyorsa `main.ts`'te `createWindow()` ile aç.
   - Boyut, davranış ve HTML yolu net olmalı.

6. **Naming Conventions**
   - IPC: kebab-case
   - DB method: camelCase
   - Preload method: renderer ile aynı
   - React component: PascalCase

7. **Robustness**
   - DB'den gelen her veriyi null/undefined kontrol et.
   - Boş veri varsa UI'da fallback göster.

8. **Do Nots**
   - React'tan direkt SQLite erişme.
   - Renderer/preload'ta hardcoded SQL kullanma.

---

Bu dosyadaki kuralları Copilot için referans olarak kullanabilirsin.

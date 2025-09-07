-- Menü Kategorileri ve Menü Öğeleri Seed Script
-- PostgreSQL için hazırlanmıştır

-- Önce mevcut menü verilerini temizle (isterseniz)
-- DELETE FROM order_items WHERE menu_item_id IN (SELECT id FROM menu_items);
-- DELETE FROM menu_items;
-- DELETE FROM menu_categories;

-- Menü Kategorileri
INSERT INTO menu_categories (name, description, color, is_active) VALUES
('Ana Yemekler', 'Et, tavuk ve balık ana yemekleri', '#EF4444', true),
('Çorbalar', 'Sıcak ve doyurucu çorbalar', '#F97316', true),
('Salatalar', 'Taze ve sağlıklı salatalar', '#22C55E', true),
('Mezeler', 'Soğuk ve sıcak mezeler', '#3B82F6', true),
('Pideler', 'Fırından çıkmış pideler', '#A855F7', true),
('Pizzalar', 'İtalyan usulü pizzalar', '#EC4899', true),
('Hamburgerler', 'Lezzetli hamburgerler', '#F59E0B', true),
('İçecekler', 'Soğuk ve sıcak içecekler', '#06B6D4', true),
('Tatlılar', 'Şerbetli ve sütlü tatlılar', '#8B5CF6', true),
('Kahvaltı', 'Kahvaltı menüsü', '#10B981', true)
ON CONFLICT (name) DO NOTHING;

-- Menü Öğeleri
INSERT INTO menu_items (name, description, price, category, category_id, available, is_active) VALUES
-- Ana Yemekler (category_id = 1)
('Izgara Köfte', 'Dana etinden hazırlanmış ızgara köfte, pilav ve salata ile', 85.00, 'Ana Yemekler', 1, true, true),
('Tavuk Şiş', 'Marineli tavuk göğsü ızgara, pilav ve garnitür ile', 75.00, 'Ana Yemekler', 1, true, true),
('Adana Kebap', 'Acılı kıyma kebabı, bulgur pilavı ve közlenmiş sebze ile', 95.00, 'Ana Yemekler', 1, true, true),
('Grilled Somon', 'Taze somon fileto, sebze garnisi ile', 120.00, 'Ana Yemekler', 1, true, true),
('Kuzu Pirzola', 'Kuzu pirzola ızgara, patates ve salata ile', 135.00, 'Ana Yemekler', 1, true, true),

-- Çorbalar (category_id = 2)
('Mercimek Çorbası', 'Kırmızı mercimek çorbası, limon ve baharatlı', 25.00, 'Çorbalar', 2, true, true),
('Tavuk Çorbası', 'Şehriye ve sebzeli tavuk çorbası', 30.00, 'Çorbalar', 2, true, true),
('Yayla Çorbası', 'Yoğurt ve pirinçli geleneksel çorba', 28.00, 'Çorbalar', 2, true, true),
('Domates Çorbası', 'Kremalı domates çorbası, fesleğen ile', 32.00, 'Çorbalar', 2, true, true),

-- Salatalar (category_id = 3)
('Çoban Salatası', 'Domates, salatalık, soğan, maydanoz, zeytinyağı', 35.00, 'Salatalar', 3, true, true),
('Sezar Salata', 'Marul, kruton, parmesan, sezar sos', 45.00, 'Salatalar', 3, true, true),
('Mevsim Salata', 'Mevsim yeşillikleri, özel sos ile', 40.00, 'Salatalar', 3, true, true),
('Ton Balığı Salata', 'Marul, ton balığı, zeytin, domates', 55.00, 'Salatalar', 3, true, true),

-- Mezeler (category_id = 4)
('Humus', 'Nohut ezmesi, tahin, zeytinyağı', 35.00, 'Mezeler', 4, true, true),
('Cacık', 'Yoğurt, salatalık, sarımsak, dereotu', 25.00, 'Mezeler', 4, true, true),
('Sigara Böreği', '6 adet peynirli sigara böreği', 40.00, 'Mezeler', 4, true, true),
('Ezme', 'Acılı ezme, domates, biber, soğan', 30.00, 'Mezeler', 4, true, true),
('Falafel', '6 adet falafel, tahin sos ile', 45.00, 'Mezeler', 4, true, true),

-- Pideler (category_id = 5)
('Kıymalı Pide', 'Kıyma, soğan, domates, biber', 65.00, 'Pideler', 5, true, true),
('Peynirli Pide', 'Beyaz peynir, kaşar peyniri', 55.00, 'Pideler', 5, true, true),
('Karışık Pide', 'Kıyma, peynir, sucuklu', 75.00, 'Pideler', 5, true, true),
('Sucuklu Pide', 'Sucuk, kaşar peyniri', 60.00, 'Pideler', 5, true, true),

-- Pizzalar (category_id = 6)
('Margherita Pizza', 'Domates sos, mozzarella, fesleğen', 70.00, 'Pizzalar', 6, true, true),
('Pepperoni Pizza', 'Domates sos, mozzarella, pepperoni', 85.00, 'Pizzalar', 6, true, true),
('Karışık Pizza', 'Domates sos, mozzarella, salam, mantar, zeytin', 90.00, 'Pizzalar', 6, true, true),
('Vejeteryan Pizza', 'Domates sos, mozzarella, sebzeler', 80.00, 'Pizzalar', 6, true, true),

-- Hamburgerler (category_id = 7)
('Klasik Burger', 'Dana köfte, marul, domates, soğan, turşu', 65.00, 'Hamburgerler', 7, true, true),
('Cheeseburger', 'Dana köfte, kaşar peyniri, marul, domates', 70.00, 'Hamburgerler', 7, true, true),
('Tavuk Burger', 'Izgara tavuk, marul, domates, özel sos', 60.00, 'Hamburgerler', 7, true, true),
('Mega Burger', 'Çift köfte, çift peynir, özel sos', 95.00, 'Hamburgerler', 7, true, true),

-- İçecekler (category_id = 8)
('Çay', 'Geleneksel türk çayı', 8.00, 'İçecekler', 8, true, true),
('Türk Kahvesi', 'Geleneksel türk kahvesi', 20.00, 'İçecekler', 8, true, true),
('Americano', 'Espresso ve sıcak su', 25.00, 'İçecekler', 8, true, true),
('Cappuccino', 'Espresso, süt köpüğü', 30.00, 'İçecekler', 8, true, true),
('Coca Cola', '33cl kutu', 15.00, 'İçecekler', 8, true, true),
('Fanta', '33cl kutu', 15.00, 'İçecekler', 8, true, true),
('Ayran', 'Ev yapımı ayran', 12.00, 'İçecekler', 8, true, true),
('Su', '0.5L şişe su', 8.00, 'İçecekler', 8, true, true),
('Taze Sıkılmış Portakal', 'Taze portakal suyu', 25.00, 'İçecekler', 8, true, true),

-- Tatlılar (category_id = 9)
('Baklava', '4 dilim antep fıstıklı baklava', 45.00, 'Tatlılar', 9, true, true),
('Künefe', 'Tel kadayıf, peynir, şerbet', 50.00, 'Tatlılar', 9, true, true),
('Tiramisu', 'İtalyan tatlısı', 40.00, 'Tatlılar', 9, true, true),
('Cheesecake', 'Çilekli cheesecake', 35.00, 'Tatlılar', 9, true, true),
('Dondurma', '3 top mevsim dondurmaSı', 25.00, 'Tatlılar', 9, true, true),

-- Kahvaltı (category_id = 10)
('Serpme Kahvaltı', 'Peynir, zeytin, reçel, bal, tereyağı, domates, salatalık', 75.00, 'Kahvaltı', 10, true, true),
('Omlet', '3 yumurta omlet, peynir opsiyonel', 35.00, 'Kahvaltı', 10, true, true),
('Menemen', 'Yumurta, domates, biber', 30.00, 'Kahvaltı', 10, true, true),
('Sucuklu Yumurta', 'Sucuk ve 2 yumurta', 40.00, 'Kahvaltı', 10, true, true),
('Börek', 'Su böreği, peynirli', 25.00, 'Kahvaltı', 10, true, true)

ON CONFLICT (name) DO NOTHING;

-- Kategorilere göre toplam ürün sayısını göster
SELECT 
    mc.name as kategori_adi,
    mc.color as renk,
    COUNT(mi.id) as urun_sayisi
FROM menu_categories mc
LEFT JOIN menu_items mi ON mc.id = mi.category_id
WHERE mc.is_active = true
GROUP BY mc.id, mc.name, mc.color
ORDER BY mc.name;

-- Toplam ürün sayısını göster
SELECT COUNT(*) as toplam_menu_urun_sayisi FROM menu_items WHERE is_active = true;

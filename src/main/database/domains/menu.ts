import { DatabaseManager, MenuItem, MenuCategory } from '../DatabaseManager';

export function registerMenuDomain(proto: typeof DatabaseManager.prototype) {
  proto.getMenuItems = async function (this: DatabaseManager): Promise<MenuItem[]> {
    const rows = await (this as any).all('SELECT * FROM menu_items WHERE available = $1 AND is_active = $2 ORDER BY category, name', [true, true]);
    return rows.map((item: any) => ({ id: item.id, name: item.name, description: item.description, price: item.price, category: item.category, categoryId: item.category_id, available: item.available, image: item.image }));
  };

  proto.getActiveMenuItemPrice = async function (this: DatabaseManager, id: number): Promise<number | null> {
    const row = await (this as any).get('SELECT price FROM menu_items WHERE id = $1 AND available = true AND is_active = true', [id]);
    return row ? row.price : null;
  };

  proto.createMenuItem = async function (this: DatabaseManager, data: { name: string; description: string; price: number; category: string; available?: boolean }): Promise<MenuItem> {
    try {
      console.log('Creating menu item:', data);
      let categoryId = null;
      try {
        const categoryResult = await (this as any).get('SELECT id FROM menu_categories WHERE name = $1', [data.category]);
        categoryId = categoryResult?.id || null;
        console.log('Found category ID:', categoryId, 'for category:', data.category);
      } catch (categoryError) {
        console.warn('Category lookup failed, continuing without category_id:', categoryError);
      }
      const existing = await (this as any).get('SELECT * FROM menu_items WHERE name = $1', [data.name]);
      if (existing) {
        if (existing.is_active === false || existing.is_active === 0) {
          console.log('Reactivating menu item id=' + existing.id);
          await (this as any).run('UPDATE menu_items SET description = $1, price = $2, category = $3, category_id = $4, available = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',[data.description, data.price, data.category, categoryId, data.available !== false ? true : false, true, existing.id]);
          const item = await (this as any).get('SELECT * FROM menu_items WHERE id = $1', [existing.id]);
          return { id: item.id, name: item.name, description: item.description, price: item.price, category: item.category, categoryId: item.category_id, available: item.available, image: item.image };
        }
        throw new Error('Bu isimde bir ürün zaten mevcut.');
      }
      console.log('Inserting menu item with categoryId:', categoryId);
      const result = await (this as any).run('INSERT INTO menu_items (name, description, price, category, category_id, available, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',[data.name, data.description, data.price, data.category, categoryId, data.available !== false ? true : false, true]);
      console.log('Insert result:', result);
      const item = await (this as any).get('SELECT * FROM menu_items WHERE id = $1', [result.id]);
      if (!item) throw new Error('Menü öğesi oluşturuldu ama bulunamadı');
      const menuItem = { id: item.id, name: item.name, description: item.description, price: item.price, category: item.category, categoryId: item.category_id, available: item.available, image: item.image };
      console.log('Successfully created menu item:', menuItem);
      return menuItem;
    } catch (error) {
      console.error('Full error in createMenuItem:', error);
      if ((error as any).message.includes('UNIQUE constraint failed: menu_items.name')) throw new Error('Bu isimde bir ürün zaten mevcut.');
      throw error;
    }
  };

  proto.updateMenuItem = async function (this: DatabaseManager, id: number, data: Partial<MenuItem>): Promise<MenuItem> {
    const updates: string[] = []; const values: any[] = [];
    if (data.name !== undefined) { updates.push('name = $' + (values.length + 1)); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = $' + (values.length + 1)); values.push(data.description); }
    if (data.price !== undefined) { updates.push('price = $' + (values.length + 1)); values.push(data.price); }
    if (data.category !== undefined) { updates.push('category = $' + (values.length + 1)); values.push(data.category); }
    if (data.available !== undefined) { updates.push('available = $' + (values.length + 1)); values.push(data.available); }
    if ((data as any).isActive !== undefined) { updates.push('is_active = $' + (values.length + 1)); values.push((data as any).isActive); }
    if (!updates.length) return await (this as any).getMenuItemById(id);
    values.push(id);
    await (this as any).run(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    return await (this as any).getMenuItemById(id);
  };

  proto.deleteMenuItem = async function (this: DatabaseManager, id: number): Promise<boolean> {
    await (this as any).run('UPDATE menu_items SET is_active = $1 WHERE id = $2', [false, id]);
    return true;
  };

  proto.getMenuCategories = async function (this: DatabaseManager): Promise<MenuCategory[]> {
    const categories = await (this as any).all('SELECT * FROM menu_categories WHERE is_active = $1 ORDER BY name', [true]);
    return categories.map((cat: any) => ({ id: cat.id, name: cat.name, description: cat.description, color: cat.color || '#6B7280', isActive: cat.is_active, createdAt: cat.created_at }));
  };

  proto.createMenuCategory = async function (this: DatabaseManager, categoryData: Omit<MenuCategory, 'id' | 'createdAt'>): Promise<MenuCategory> {
    const existing = await (this as any).get('SELECT * FROM menu_categories WHERE name = $1', [categoryData.name]);
    if (existing) {
      if (existing.is_active === false || existing.is_active === 0) {
        await (this as any).run('UPDATE menu_categories SET description=$1, color=$2, is_active=$3 WHERE id=$4',[categoryData.description || '', categoryData.color || '#6B7280', true, existing.id]);
        return await (this as any).getMenuCategoryById(existing.id);
      }
      throw new Error(`"${categoryData.name}" isimli kategori zaten mevcut`);
    }
    const result = await (this as any).run('INSERT INTO menu_categories (name, description, color, is_active) VALUES ($1,$2,$3,$4) RETURNING id',[categoryData.name, categoryData.description || '', categoryData.color || '#6B7280', categoryData.isActive]);
    return await (this as any).getMenuCategoryById(result.id);
  };

  proto.updateMenuCategory = async function (this: DatabaseManager, id: number, categoryData: Partial<Omit<MenuCategory,'id' | 'createdAt'>>): Promise<MenuCategory> {
    const updates: string[] = []; const values: any[] = [];
    if (categoryData.name !== undefined) { updates.push('name = $' + (values.length + 1)); values.push(categoryData.name); }
    if (categoryData.description !== undefined) { updates.push('description = $' + (values.length + 1)); values.push(categoryData.description); }
    if (categoryData.color !== undefined) { updates.push('color = $' + (values.length + 1)); values.push(categoryData.color); }
    if (categoryData.isActive !== undefined) { updates.push('is_active = $' + (values.length + 1)); values.push(categoryData.isActive); }
    if (!updates.length) return await (this as any).getMenuCategoryById(id);
    values.push(id);
    await (this as any).run(`UPDATE menu_categories SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    return await (this as any).getMenuCategoryById(id);
  };

  proto.deleteMenuCategory = async function (this: DatabaseManager, id: number, force: boolean = false): Promise<boolean> {
    const category = await (this as any).get('SELECT * FROM menu_categories WHERE id = $1', [id]);
    if (!category) throw new Error('Silinecek kategori bulunamadı');
    await (this as any).run('UPDATE menu_items SET is_active = $1 WHERE category_id = $2', [false, id]);
    await (this as any).run('UPDATE menu_categories SET is_active = $1 WHERE id = $2', [false, id]);
    return true;
  };
}

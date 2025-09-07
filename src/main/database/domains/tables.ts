import { DatabaseManager, Table, TableCategory } from '../DatabaseManager';

export function registerTableDomain(proto: typeof DatabaseManager.prototype) {
  proto.getTableCategories = async function (this: DatabaseManager): Promise<TableCategory[]> {
    const categories = await (this as any).all('SELECT * FROM table_categories ORDER BY name');
    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      isActive: cat.is_active,
      createdAt: cat.created_at
    }));
  };

  proto.createTableCategory = async function (this: DatabaseManager, data: { name: string; color: string }): Promise<TableCategory> {
    const existing = await (this as any).get('SELECT * FROM table_categories WHERE name = $1', [data.name]);
    if (existing) throw new Error(`"${data.name}" isimli kategori zaten mevcut.`);
    const result = await (this as any).run('INSERT INTO table_categories (name, color, is_active, created_at) VALUES ($1,$2,$3,CURRENT_TIMESTAMP) RETURNING id',[data.name, data.color, true]);
    const newCat = await (this as any).get('SELECT * FROM table_categories WHERE id = $1', [result.id]);
    return { id: newCat.id, name: newCat.name, color: newCat.color, isActive: newCat.is_active, createdAt: newCat.created_at };
  };

  proto.updateTableCategory = async function (this: DatabaseManager, id: number, data: Partial<TableCategory>): Promise<TableCategory> {
    const updates: string[] = []; const values: any[] = [];
    if (data.name !== undefined) { updates.push('name = $' + (values.length + 1)); values.push(data.name); }
    if (data.color !== undefined) { updates.push('color = $' + (values.length + 1)); values.push(data.color); }
    if (data.isActive !== undefined) { updates.push('is_active = $' + (values.length + 1)); values.push(data.isActive); }
    if (!updates.length) return await (this as any).getTableCategoryById(id);
    values.push(id);
    await (this as any).run(`UPDATE table_categories SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    return await (this as any).getTableCategoryById(id);
  };

  proto.deleteTableCategory = async function (this: DatabaseManager, id: number): Promise<boolean> {
    const tablesCount = await (this as any).get('SELECT COUNT(*) as count FROM tables WHERE category_id = $1', [id]);
    if (tablesCount.count > 0) throw new Error('Bu kategori kullanılıyor, önce masaları farklı kategoriye taşıyın');
    await (this as any).run('DELETE FROM table_categories WHERE id = $1', [id]);
    return true;
  };

  proto.getTables = async function (this: DatabaseManager): Promise<Table[]> {
    const tables = await (this as any).all(`SELECT t.*, tc.name as category_name FROM tables t LEFT JOIN table_categories tc ON t.category_id = tc.id ORDER BY t.number`);
    return tables.map((table: any) => ({ id: table.id, number: table.number, seats: table.seats, status: table.status, categoryId: table.category_id, categoryName: table.category_name, x: table.x, y: table.y }));
  };

  proto.createTable = async function (this: DatabaseManager, data: { number: string; seats: number; categoryId: number; x?: number; y?: number }): Promise<Table> {
    const existing = await (this as any).get('SELECT id FROM tables WHERE number = $1', [data.number]);
    if (existing) throw new Error(`"${data.number}" numaralı masa zaten mevcut`);
    const result = await (this as any).run('INSERT INTO tables (number, seats, category_id, x, y) VALUES ($1,$2,$3,$4,$5) RETURNING id',[data.number, data.seats, data.categoryId, data.x || 0, data.y || 0]);
    const newTable = await (this as any).get('SELECT t.*, tc.name as category_name FROM tables t LEFT JOIN table_categories tc ON t.category_id = tc.id WHERE t.id = $1',[result.id]);
    return { id: newTable.id, number: newTable.number, seats: newTable.seats, status: newTable.status, categoryId: newTable.category_id, categoryName: newTable.category_name, x: newTable.x, y: newTable.y };
  };

  proto.updateTable = async function (this: DatabaseManager, id: number, data: Partial<Table>): Promise<Table> {
    const updates: string[] = []; const values: any[] = [];
    if (data.number !== undefined) { updates.push('number = $' + (values.length + 1)); values.push(data.number); }
    if (data.seats !== undefined) { updates.push('seats = $' + (values.length + 1)); values.push(data.seats); }
    if (data.status !== undefined) { updates.push('status = $' + (values.length + 1)); values.push(data.status); }
    if (data.categoryId !== undefined) { updates.push('category_id = $' + (values.length + 1)); values.push(data.categoryId); }
    if (data.x !== undefined) { updates.push('x = $' + (values.length + 1)); values.push(data.x); }
    if (data.y !== undefined) { updates.push('y = $' + (values.length + 1)); values.push(data.y); }
    if (!updates.length) return await (this as any).getTableById(id);
    values.push(id);
    await (this as any).run(`UPDATE tables SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    return await (this as any).getTableById(id);
  };

  proto.deleteTable = async function (this: DatabaseManager, id: number): Promise<boolean> {
    const ordersCount = await (this as any).get('SELECT COUNT(*) as count FROM orders WHERE table_id = $1 AND status != $2', [id, 'paid']);
    if (ordersCount.count > 0) throw new Error('Bu masada aktif sipariş var, önce siparişleri tamamlayın');
    await (this as any).run('DELETE FROM tables WHERE id = $1', [id]);
    return true;
  };
}

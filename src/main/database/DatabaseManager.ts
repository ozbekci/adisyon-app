import bcrypt from 'bcrypt';
// Domain registrations
import { registerUserDomain } from './domains/users';
import { registerOrderDomain } from './domains/orders';
import { registerMenuDomain } from './domains/menu';
import { registerTableDomain } from './domains/tables';
import { registerCustomerDomain } from './domains/customers';
import { registerFeatureDomain } from './domains/features';
import { registerWaiterDomain } from './domains/waiters';
import { registerReportingDomain } from './domains/reporting';
import { registerCashSessionDomain } from './domains/cashSessions';
export interface TableCategory {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface Table {
  id: number;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  categoryId: number;
  categoryName?: string;
  x?: number;
  y?: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: number;
  available: boolean;
  image?: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  tableId: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
  payment_status: 'unpaid' | 'paid' | 'debt';
  total: number;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  quantity: number;
  notes?: string;
  price: number;
  createdAt?: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'manager' | 'cashier' | 'waiter';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Customer {
  id: number;
  customerName: string;
  address?: string;
  telephoneNumber?: string;
  createdAt: string;
}

export class DatabaseManager {
  private static domainsRegistered = false;
  private db: any = null;
  private dbPath: string;

  // ===== Domain method type declarations (implemented via prototype at runtime) =====
  // Reporting
  getRevenueData!: (params?: { start?: string; end?: string; groupBy?: 'day' | 'month' | 'year' }) => Promise<any[]>;
  getProductSales!: (args: { start?: string; end?: string; orderBy?: 'quantity' | 'revenue' }) => Promise<any[]>;
  // Users
  authenticateUser!: (username: string, password: string) => Promise<any>;
  getUsers!: () => Promise<any[]>;
  createUser!: (data: { username: string; password: string; fullName: string; role: string }) => Promise<any>;
  updateUser!: (id: number, data: { username?: string; password?: string; fullName?: string; role?: 'manager'|'cashier'|'waiter'; isActive?: boolean }) => Promise<any>;
  deleteUser!: (id: number) => Promise<boolean>;
  deleteUserHard!: (id: number) => Promise<boolean>;
  // Orders
  getOpenOrderForTable!: (tableId: number) => Promise<any>;
  addItemsToOrder!: (orderId: number, items: Array<{ menuItemId: number; quantity: number; notes?: string }>) => Promise<any>;
  listActiveOrders!: () => Promise<any[]>;
  getOrderPublic!: (orderId: number) => Promise<any>;
  updateOrderStatusValidated!: (orderId: number, newStatus: string, expectedVersion?: number) => Promise<any>;
  createOrder!: (orderData: any) => Promise<Order>;
  getOrders!: () => Promise<Order[]>;
  processPayment!: (paymentData: { orderId: number; amount: number; method: string; customer_id?: number }) => Promise<any>;
  updateOrderStatus!: (orderId: number, status: string) => Promise<Order>;
  deleteOrder!: (orderId: number) => Promise<boolean>;
  getPastOrders!: () => Promise<any[]>;
  recordPartialPayment!: (orderHistoryId: number, cash: number, credit_kart: number, ticket: number) => Promise<void>;
  // Menu
  getMenuItems!: () => Promise<MenuItem[]>;
  createMenuItem!: (data: { name: string; description: string; price: number; category: string; available?: boolean }) => Promise<MenuItem>;
  updateMenuItem!: (id: number, data: Partial<MenuItem>) => Promise<MenuItem>;
  deleteMenuItem!: (id: number) => Promise<boolean>;
  reactivateMenuItem!: (id: number) => Promise<MenuItem>;
  getMenuCategories!: () => Promise<MenuCategory[]>;
  createMenuCategory!: (data: Omit<MenuCategory,'id'|'createdAt'>) => Promise<MenuCategory>;
  updateMenuCategory!: (id: number, data: { name?: string; description?: string; color?: string; is_active?: boolean }) => Promise<MenuCategory>;
  deleteMenuCategory!: (id: number) => Promise<boolean>;
  // Tables
  getTableCategories!: () => Promise<TableCategory[]>;
  createTableCategory!: (data: { name: string; color: string }) => Promise<TableCategory>;
  updateTableCategory!: (id: number, data: { name?: string; color?: string; is_active?: boolean }) => Promise<TableCategory>;
  deleteTableCategory!: (id: number) => Promise<boolean>;
  getTables!: () => Promise<Table[]>;
  createTable!: (data: { number: string; seats: number; categoryId: number; x?: number; y?: number }) => Promise<Table>;
  updateTable!: (id: number, data: { number?: string; seats?: number; status?: 'available'|'occupied'|'reserved'|'cleaning'; categoryId?: number; x?: number; y?: number }) => Promise<Table>;
  getActiveMenuItemPrice!: (id: number) => Promise<number | null>;
  deleteTable!: (id: number) => Promise<boolean>;
  updateTableStatus!: (id: number, status: string) => Promise<Table>;
  // Customers
  getCustomers!: () => Promise<Customer[]>;
  createCustomer!: (data: { customerName: string; address?: string; telephoneNumber?: string }) => Promise<Customer>;
  updateCustomer!: (id: number, data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer!: (id: number) => Promise<boolean>;
  searchCustomers!: (query: string) => Promise<Customer[]>;
  getCustomersWithDebt!: () => Promise<Array<{ id: number; customerName: string; debt: number }>>;
  getCustomerDebts!: (customerId: number) => Promise<any[]>;
  settleCustomerDebts!: (data: { customerId: number; orderHistoryIds: number[]; method: string }) => Promise<boolean>;
  getCustomerOrderHistory!: (customerId?: number) => Promise<any[]>;
  // Features
  getFeatureFlags!: () => Promise<any>;
  setMobileEnabled!: (enabled: boolean) => Promise<any>;
  // Waiters
  getActiveWaiters!: () => Promise<Array<{ id: number; name: string }>>;
  verifyWaiterPin!: (waiterId: number, pin: string) => Promise<any>;
  waiterStatus!: (waiterId: number) => Promise<{ active: boolean }>;
  setWaiterPin!: (userId: number, pin: string) => Promise<boolean>;
  // Cash Sessions
  getCashStatus!: () => Promise<{ isOpen: boolean; session: any }>;
  openCashSession!: (openingUser: string, openingAmount: number) => Promise<any>;
  closeCashSession!: (closingUser: string, realCashCounted: number) => Promise<any>;
  getOpenCashSessionInternal!: () => Promise<any>;

  private debug = process.env.DEBUG_DB === '1';

  constructor() {
    this.dbPath = process.env.PG_CONNECTION_STRING || 'postgresql://postgres:1234@localhost:5432/restoran';
    console.log('DatabaseManager - Using PostgreSQL connection:', this.dbPath);
    if (!DatabaseManager.domainsRegistered) {
      registerUserDomain(DatabaseManager.prototype);
      registerOrderDomain(DatabaseManager.prototype);
      registerMenuDomain(DatabaseManager.prototype);
      registerTableDomain(DatabaseManager.prototype);
      registerCustomerDomain(DatabaseManager.prototype);
      registerFeatureDomain(DatabaseManager.prototype);
      registerWaiterDomain(DatabaseManager.prototype);
      registerReportingDomain(DatabaseManager.prototype);
      registerCashSessionDomain(DatabaseManager.prototype);
      DatabaseManager.domainsRegistered = true;
    }
  }

  private getTurkeyDateTime(): string {
    // Europe/Istanbul timezone (DST aware)
    try {
      const fmt = new Intl.DateTimeFormat('tr-TR', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
      return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
    } catch {
      // Fallback fixed offset (legacy behavior)
      const now = new Date();
      const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
      return turkeyTime.toISOString().replace('T', ' ').slice(0, 19);
    }
  }

  async initialize(): Promise<void> {
    const { Client } = require('pg');
    this.db = new Client({ connectionString: this.dbPath });
    try {
      await this.db.connect();
      await this.createTables();
    } catch (err) {
      console.error('PostgreSQL bağlantı hatası:', err);
      throw err;
    }
  }

  private async createTables(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS order_history (id SERIAL PRIMARY KEY, order_type TEXT, customer_id INTEGER, total REAL, payment_status TEXT, paid_at TIMESTAMP, payment_method TEXT, paid_amount REAL, created_at TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS partial_orders (id SERIAL PRIMARY KEY, order_history_id INTEGER NOT NULL, cash REAL DEFAULT 0, credit_kart REAL DEFAULT 0, ticket REAL DEFAULT 0, FOREIGN KEY (order_history_id) REFERENCES order_history(id))`,
      `CREATE TABLE IF NOT EXISTS table_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT NOT NULL DEFAULT '#3B82F6', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS tables (id SERIAL PRIMARY KEY, number TEXT NOT NULL UNIQUE, seats INTEGER NOT NULL, status TEXT DEFAULT 'available', category_id INTEGER NOT NULL, x INTEGER DEFAULT 0, y INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES table_categories(id))`,
      `CREATE TABLE IF NOT EXISTS menu_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, color TEXT NOT NULL DEFAULT '#6B7280', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS menu_items (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, price REAL NOT NULL, category TEXT NOT NULL, category_id INTEGER, available BOOLEAN DEFAULT TRUE, is_active BOOLEAN DEFAULT TRUE, image TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES menu_categories(id))`,
      `CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, table_id INTEGER, order_type TEXT DEFAULT 'dine-in', customer_id INTEGER, customer_name TEXT, payment_status TEXT DEFAULT 'unpaid', paid_at TIMESTAMP, payment_method TEXT, paid_amount REAL, table_number TEXT, status TEXT DEFAULT 'pending', total REAL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, version INTEGER DEFAULT 0, FOREIGN KEY (table_id) REFERENCES tables(id), FOREIGN KEY (customer_id) REFERENCES customers(id))`,
      `CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL, menu_item_id INTEGER NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (menu_item_id) REFERENCES menu_items(id))`,
      `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT, full_name TEXT NOT NULL, role TEXT DEFAULT 'waiter', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_login TIMESTAMP,  last_checkin_at TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY, customer_name TEXT NOT NULL, address TEXT, telephone_number TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS order_history_items (id SERIAL PRIMARY KEY, order_history_id INTEGER NOT NULL, menu_item_id INTEGER NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL, notes TEXT, FOREIGN KEY (order_history_id) REFERENCES order_history(id), FOREIGN KEY (menu_item_id) REFERENCES menu_items(id))`,
      `CREATE TABLE IF NOT EXISTS cash_sessions (id SERIAL PRIMARY KEY, opened_at TIMESTAMP NOT NULL, closed_at TIMESTAMP, is_open BOOLEAN DEFAULT TRUE, opening_user TEXT, closing_user TEXT, opening_amount REAL DEFAULT 0, cash_total REAL, card_total REAL, real_cash_counted REAL, difference REAL)`,
      `CREATE TABLE IF NOT EXISTS devices (id SERIAL PRIMARY KEY, name TEXT, platform TEXT, verification_code TEXT, code_expires_at TIMESTAMP, is_trusted BOOLEAN DEFAULT FALSE, verified_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_ip TEXT)`,
      `CREATE TABLE IF NOT EXISTS features (id SERIAL PRIMARY KEY, mobile_enabled BOOLEAN DEFAULT TRUE, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    ];
    for (const q of queries) { await this.run(q); }
    await this.ensureSchemaUpgrades();
    await this.ensureAdminUser();
    await this.ensureFeatureRow();
    await this.ensureSampleWaiters();
  }

  private async ensureSchemaUpgrades() {
    const alters = [
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER",
      "ALTER TABLE tables ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checkin_at TIMESTAMP"
    ];
    for (const a of alters) { try { await this.run(a); } catch (e) { console.warn('Schema upgrade skip:', a, e?.toString()); } }
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)",
      "CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status)",
      "CREATE INDEX IF NOT EXISTS idx_menu_items_updated_at ON menu_items(updated_at)",
      "CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at)",
      "CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)"
    ];
    for (const i of indexes) { try { await this.run(i); } catch (e) { console.warn('Index create skip:', i, e?.toString()); } }
  }

  private async ensureFeatureRow() {
    const row = await this.get('SELECT * FROM features LIMIT 1');
    if (!row) await this.run('INSERT INTO features (mobile_enabled) VALUES ($1)', [true]);
  }

  private async ensureSampleWaiters() {
    const waiter = await this.get("SELECT id FROM users WHERE role = 'waiter' LIMIT 1");
    if (!waiter) {
      const pass1 = await bcrypt.hash('1111', 10);
      const pass2 = await bcrypt.hash('2222', 10);
      await this.run('INSERT INTO users (username, full_name, role, password_hash, is_active) VALUES ($1,$2,$3,$4,$5)', ['waiter1', 'Garson 1', 'waiter', pass1, true]);
      await this.run('INSERT INTO users (username, full_name, role, password_hash, is_active) VALUES ($1,$2,$3,$4,$5)', ['waiter2', 'Garson 2', 'waiter', pass2, true]);
      console.log('Sample waiter users seeded (PINs: 1111, 2222)');
    }
    // Backfill: ensure all waiters have a password_hash (default '1111' if missing)
    try {
      const defaultHash = await bcrypt.hash('1111', 10);
      await this.run("UPDATE users SET password_hash = $1 WHERE role = 'waiter' AND (password_hash IS NULL OR password_hash = '')", [defaultHash]);
    } catch { /* ignore */ }
  }

  private async ensureAdminUser(): Promise<void> {
    try {
      const adminUser = await this.get('SELECT * FROM users WHERE username = $1', ['admin']);
      if (!adminUser) {
        console.log('Creating default admin user...');
        const hash = await bcrypt.hash('123456', 10);
        await this.run('INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES ($1,$2,$3,$4,$5)', ['admin', hash, 'Sistem Yöneticisi', 'manager', true]);
        console.log('Default admin user created: username=admin, password=123456');
      } else if (!adminUser.password_hash) {
        // Backfill password hash for legacy admin without hash
        const hash = await bcrypt.hash('123456', 10);
        await this.run('UPDATE users SET password_hash = $1, role = COALESCE(role, $2), is_active = $3 WHERE id = $4', [hash, 'manager', true, adminUser.id]);
        console.log('Backfilled admin password hash (username=admin, password=123456)');
      } else if (adminUser.is_active === false) {
        await this.run('UPDATE users SET is_active = $1 WHERE id = $2', [true, adminUser.id]);
        console.log('Re-activated admin user');
      }
    } catch (e) { console.error('Error ensuring admin user:', e); }
  }

  public async run(sql: string, params: any[] = []): Promise<{ id?: any; changes: number }> {
    if (this.debug) console.log('[DB][RUN]', sql, params);
    const result = await this.db.query(sql, params);
    if (result.command === 'INSERT' && result.rows?.[0]?.id !== undefined) return { id: result.rows[0].id, changes: result.rowCount };
    return { changes: result.rowCount };
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (this.debug) console.log('[DB][GET]', sql, params);
    const result = await this.db.query(sql, params);
    return result.rows[0] || null;
  }

  public async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.debug) console.log('[DB][ALL]', sql, params);
    const result = await this.db.query(sql, params);
    return result.rows;
  }

  // Simple transaction helpers
  async begin() { if (this.debug) console.log('[DB][TX] BEGIN'); await this.db.query('BEGIN'); }
  async commit() { if (this.debug) console.log('[DB][TX] COMMIT'); await this.db.query('COMMIT'); }
  async rollback() { if (this.debug) console.log('[DB][TX] ROLLBACK'); await this.db.query('ROLLBACK'); }
  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.begin();
    try { const res = await fn(); await this.commit(); return res; }
    catch (e) { await this.rollback(); throw e; }
  }

  // ===== Auth helpers (used by domains) =====
  async getRawUserByUsername(username: string) { return await this.get('SELECT * FROM users WHERE username = $1', [username]); }
  async setUserPasswordHash(userId: number, hash: string) { await this.run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]); }
  async touchLastLogin(userId: number) { const dt = this.getTurkeyDateTime(); await this.run('UPDATE users SET last_login = $1 WHERE id = $2', [dt, userId]); }

  // ===== Helper entity fetchers (referenced inside domain modules) =====
  async getUserById(id: number): Promise<User> {
    const user = await this.get('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) throw new Error(`Kullanıcı bulunamadı: ${id}`);
    return { id: user.id, username: user.username, fullName: user.full_name, role: user.role, isActive: user.is_active, createdAt: user.created_at, lastLogin: user.last_login };
  }
  async getOrderById(id: number): Promise<Order> {
    const order = await this.get('SELECT * FROM orders WHERE id = $1', [id]);
    const rows: any[] = await this.all('SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price, oi.notes, oi.created_at, mi.name, mi.description FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = $1', [id]);
    order.items = rows.map(r => ({ id: r.id, menuItemId: r.menu_item_id, quantity: r.quantity, price: r.price, notes: r.notes, created_at: r.created_at, name: r.name, description: r.description }));
    return order;
  }
  async getMenuItemById(id: number): Promise<MenuItem> {
    const item = await this.get('SELECT * FROM menu_items WHERE id = $1', [id]);
    if (!item) throw new Error(`Menü öğesi bulunamadı: ${id}`);
    return { id: item.id, name: item.name, description: item.description, price: item.price, category: item.category, categoryId: item.category_id, available: item.available, image: item.image };
  }
  async getMenuCategoryById(id: number): Promise<MenuCategory> {
    const category = await this.get('SELECT * FROM menu_categories WHERE id = $1', [id]);
    if (!category) throw new Error(`Menü kategorisi bulunamadı: ${id}`);
    return { id: category.id, name: category.name, description: category.description, color: category.color || '#6B7280', isActive: category.is_active, createdAt: category.created_at };
  }
  async getTableCategoryById(id: number): Promise<TableCategory> {
    const cat = await this.get('SELECT * FROM table_categories WHERE id = $1', [id]);
    if (!cat) throw new Error(`Kategori bulunamadı (ID: ${id})`);
    return { id: cat.id, name: cat.name, color: cat.color, isActive: cat.is_active, createdAt: cat.created_at };
  }
  async getTableById(id: number): Promise<Table> {
    const table = await this.get('SELECT t.*, tc.name as category_name FROM tables t LEFT JOIN table_categories tc ON t.category_id = tc.id WHERE t.id = $1', [id]);
    if (!table) throw new Error(`Masa bulunamadı: ${id}`);
    return { id: table.id, number: table.number, seats: table.seats, status: table.status, categoryId: table.category_id, categoryName: table.category_name, x: table.x, y: table.y };
  }
  async getCustomerById(id: number): Promise<Customer> {
    const customer = await this.get('SELECT * FROM customers WHERE id = $1', [id]);
    if (!customer) throw new Error(`Müşteri bulunamadı: ${id}`);
    return { id: customer.id, customerName: customer.customer_name, address: customer.address, telephoneNumber: customer.telephone_number, createdAt: customer.created_at };
  }

  async close(): Promise<void> {
    if (this.db) { try { await this.db.end(); } catch { /* ignore */ } }
  }
}

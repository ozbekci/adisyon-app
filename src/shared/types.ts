export interface User {
  id: number;
  username: string;
  password?: string; // Genelde frontend'de gösterilmez
  fullName: string;
  role: 'manager' | 'cashier' | 'waiter';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Order {
  id: number;
  tableId?: number;
  table_id?: number;
  table_number?: string;
  customer_name?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
  payment_status: 'unpaid' | 'paid' | 'debt';
  payment_method?: PaymentMethod;
  partialPayments?: Array<{ cash: number; credit_kart: number; ticket: number }>;
  total: number;
  created_at: string;
  updatedAt: string;
  completed_at?: string;
}

// Unified payment method type used across renderer and main. Keep all variants seen in code/db.
export type PaymentMethod =
  | 'nakit'
  | 'kredi-karti'
  | 'ticket'
  | 'borc'
  | 'partial-payment';

export interface OrderItem {
  id: number;
  menuItemId?: number;
  menu_item_id?: number;
  name?: string;
  description?: string;
  quantity: number;
  notes?: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ElectronAPI {
  getRevenueData: any;
  getTables: () => Promise<any[]>;
  getMenuItems: () => Promise<any[]>;
  createOrder: (orderData: any) => Promise<any>;
  getOrders: () => Promise<any[]>;
  processPayment: (paymentData: any) => Promise<any>;
  updateOrderStatus: (orderId: number, status: string) => Promise<any>;
  getPastOrders: () => Promise<any[]>;
  getProductSales: (params?: { start?: string; end?: string; orderBy?: 'quantity' | 'revenue' }) => Promise<any[]>;
  getCustomers: () => Promise<any[]>;
  getCustomersWithDebt: () => Promise<any[]>;
  getCustomerDebts: (customerId: number) => Promise<any[]>;
  settleCustomerDebts: (data: { customerId: number; orderHistoryIds: number[]; method: PaymentMethod }) => Promise<boolean>;
  getCustomerOrderHistory?: (customerId?: number) => Promise<any[]>;
  
  // User management
  authenticateUser: (username: string, password: string) => Promise<User | null>;
  getUsers: () => Promise<User[]>;
  createUser: (userData: { username: string; password: string; fullName: string; role: string }) => Promise<User>;
  updateUser: (id: number, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: number) => Promise<boolean>;
  deleteUserHard?: (id: number) => Promise<boolean>;
  
  // Table categories management
  getTableCategories: () => Promise<TableCategory[]>;
  createTableCategory: (categoryData: { name: string; color: string }) => Promise<TableCategory>;
  updateTableCategory: (id: number, categoryData: Partial<TableCategory>) => Promise<TableCategory>;
  deleteTableCategory: (id: number) => Promise<boolean>;
  
  // Table management
  createTable: (tableData: { number: string; seats: number; categoryId: number; x?: number; y?: number }) => Promise<Table>;
  updateTable: (id: number, tableData: Partial<Table>) => Promise<Table>;
  deleteTable: (id: number) => Promise<boolean>;
}

export interface TableCategory {
  id: number;
  name: string;
  color: string; // Hex color code
  isActive: boolean;
  createdAt: string;
}

export interface Table {
  id: number;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  categoryId: number;
  categoryName?: string; // Join edilen kategori adı
  x?: number;
  y?: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};

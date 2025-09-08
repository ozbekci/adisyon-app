import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loading...');

const electronAPI = {
  // Customers management
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  getCustomersWithDebt: () => ipcRenderer.invoke('get-customers-with-debt'),
  getCustomerDebts: (customerId: number) => ipcRenderer.invoke('get-customer-debts', customerId),
  settleCustomerDebts: (data: { customerId: number; orderHistoryIds: number[]; method: string }) => ipcRenderer.invoke('settle-customer-debts', data),
  getCustomerOrderHistory: (customerId?: number) => ipcRenderer.invoke('get-customer-order-history', customerId),
  addCustomer: (customerData: any) => ipcRenderer.invoke('add-customer', customerData),
  updateCustomer: (id: number, customerData: any) => ipcRenderer.invoke('update-customer', { id, customerData }),
  getTables: () => ipcRenderer.invoke('get-tables'),
  getMenuItems: () => ipcRenderer.invoke('get-menu-items'),
  createOrder: (orderData: any) => ipcRenderer.invoke('create-order', orderData),
  getOrders: () => ipcRenderer.invoke('get-orders'),
  processPayment: (paymentData: any) => ipcRenderer.invoke('process-payment', paymentData),
  deleteOrder: (orderId: number) => ipcRenderer.invoke('delete-order', orderId),
  getRevenueData: (params: { start?: string; end?: string; groupBy?: 'day' | 'month' | 'year' }) => ipcRenderer.invoke('get-revenue-data', params),
  // Product sales analytics
  getProductSales: (params: { start: string; end: string; orderBy?: 'quantity' | 'revenue' }) => ipcRenderer.invoke('get-product-sales', params),
  
  // User management
  authenticateUser: (username: string, password: string) => ipcRenderer.invoke('authenticate-user', { username, password }),
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (userData: any) => ipcRenderer.invoke('create-user', userData),
  updateUser: (id: number, userData: any) => ipcRenderer.invoke('update-user', { id, userData }),
  deleteUser: (id: number) => ipcRenderer.invoke('delete-user', id),
  deleteUserHard: (id: number) => ipcRenderer.invoke('delete-user-hard', id),
  
  // Table categories management
  getTableCategories: () => ipcRenderer.invoke('get-table-categories'),
  createTableCategory: (categoryData: any) => ipcRenderer.invoke('create-table-category', categoryData),
  updateTableCategory: (id: number, categoryData: any) => ipcRenderer.invoke('update-table-category', { id, categoryData }),
  deleteTableCategory: (id: number) => ipcRenderer.invoke('delete-table-category', id),
  
  // Table management
  createTable: (tableData: any) => ipcRenderer.invoke('create-table', tableData),
  updateTable: (id: number, tableData: any) => ipcRenderer.invoke('update-table', { id, tableData }),
  deleteTable: (id: number) => ipcRenderer.invoke('delete-table', id),
  
  // Menu items management
  createMenuItem: (itemData: any) => ipcRenderer.invoke('create-menu-item', itemData),
  updateMenuItem: (id: number, itemData: any) => ipcRenderer.invoke('update-menu-item', { id, itemData }),
  deleteMenuItem: (id: number) => ipcRenderer.invoke('delete-menu-item', id),
  
  // Menu categories management
  getMenuCategories: () => ipcRenderer.invoke('get-menu-categories'),
  createMenuCategory: (categoryData: any) => ipcRenderer.invoke('create-menu-category', categoryData),
  updateMenuCategory: (id: number, categoryData: any) => ipcRenderer.invoke('update-menu-category', { id, categoryData }),
  deleteMenuCategory: (id: number) => ipcRenderer.invoke('delete-menu-category', id),
  
  // Admin window management
  openAdminWindow: () => ipcRenderer.invoke('open-admin-window'),
  closeAdminWindow: () => ipcRenderer.invoke('close-admin-window'),
  adminVerified: () => ipcRenderer.invoke('admin-verified'),
  
  // Event listeners
  onAdminVerificationSuccess: (callback: () => void): (() => void) => {
    ipcRenderer.on('admin-verification-success', callback);
    return () => ipcRenderer.removeListener('admin-verification-success', callback);
  },
  
  // Password verification functions
  verifyAdminPassword: (password: string) => ipcRenderer.invoke('verify-admin-password', password),
  closePasswordWindow: () => ipcRenderer.invoke('close-password-window'),
  completeOrder: (orderId: number) => ipcRenderer.invoke('complete-order', orderId),
  getOrderHistory: () => ipcRenderer.invoke('get-order-history'),
  updateOrderStatus: (orderId: number, status: string) => ipcRenderer.invoke('update-order-status', { orderId, status }),
  getPastOrders: () => ipcRenderer.invoke('get-past-orders'),
  recordPartialPayment: (data: { orderHistoryId: number; cash: number; credit_kart: number; ticket: number }) =>
    ipcRenderer.invoke('record-partial-payment', data),
  // Cash session
  getCashStatus: () => ipcRenderer.invoke('cash-status'),
  openCashSession: (params: { user: string; openingAmount: number }) => ipcRenderer.invoke('cash-open', params),
  closeCashSession: (params: { user: string; realCash: number }) => ipcRenderer.invoke('cash-close', params),
  openCashWindow: (mode: 'open' | 'close') => ipcRenderer.invoke('open-cash-window', mode),
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('ElectronAPI exposed successfully');
  console.log('Available API methods:', Object.keys(electronAPI));
} catch (error) {
  console.error('Failed to expose ElectronAPI:', error);
}

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

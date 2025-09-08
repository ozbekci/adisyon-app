import { app, BrowserWindow, ipcMain } from 'electron';
import { StartedServer, startServer } from './server/startServer';
import * as path from 'path';
import { DatabaseManager } from './database/DatabaseManager';

// Set app name for proper userData folder (must be before app.whenReady())
app.setName('adisyon');

// Global variables
let mainWindow: BrowserWindow;
let dbManager: DatabaseManager;
let adminWindow: BrowserWindow | null = null;
let adminPasswordWindow: BrowserWindow | null = null;
let passwordWindow: BrowserWindow | null = null;
let cashWindow: BrowserWindow | null = null;
let startedServer: StartedServer | null = null;

const createWindow = (): void => {
  // Create the browser window
  const preloadPath = path.join(__dirname, '../preload/preload.js');
  console.log('Preload path:', preloadPath);
  
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Only for development
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3002');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
};

ipcMain.handle('record-partial-payment', async (event, data) => {
  const { orderHistoryId, cash, credit_kart, ticket } = data;
  await dbManager.recordPartialPayment(orderHistoryId, cash, credit_kart, ticket);
  return true;
});
const createCashWindow = (mode: 'open' | 'close') => {
  if (cashWindow) {
    cashWindow.focus();
    return;
  }
  const preloadPath = path.join(__dirname, '../preload/preload.js');
  cashWindow = new BrowserWindow({
    width: 420,
    height: 550,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    resizable: false,
    title: mode === 'open' ? 'Kasa Açılışı' : 'Kasa Kapanışı',
  });

  if (process.env.NODE_ENV === 'development') {
    cashWindow.loadURL(`http://localhost:3002/#/cash/${mode}`);
  } else {
    cashWindow.loadFile(path.join(__dirname, `../renderer/cash.html`), {
      hash: `/cash/${mode}`,
    });
  }

  cashWindow.on('closed', () => {
    cashWindow = null;
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Set development environment
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  
  // Initialize database
  dbManager = new DatabaseManager();
  await dbManager.initialize();
  // Start modular server
  startedServer = await startServer(dbManager);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for restaurant operations
ipcMain.handle('get-tables', async () => {
  try {
    return await dbManager.getTables();
  } catch (error) {
    console.error('IPC: Error getting tables:', error);
    throw error;
  }
});

// IPC handlers for customer operations

ipcMain.handle('get-customers', async () => {
  try {
    return await dbManager.getCustomers();
  } catch (error) {
    console.error('IPC: Error getting customers:', error);
    throw error;
  }
});

ipcMain.handle('get-users', async() =>{
  return await dbManager.getUsers();
});



ipcMain.handle('get-customers-with-debt', async () => {
  try {
    return await dbManager.getCustomersWithDebt();
  } catch (error) {
    console.error('IPC: Error getting customers with debt:', error);
    throw error;
  }
});

// Customer debt details
ipcMain.handle('get-customer-debts', async (_evt, customerId: number) => {
  try {
    return await dbManager.getCustomerDebts(customerId);
  } catch (error) {
    console.error('IPC: Error getting customer debts:', error);
    throw error;
  }
});

ipcMain.handle('settle-customer-debts', async (_evt, data: { customerId: number; orderHistoryIds: number[]; method: string }) => {
  try {
    return await dbManager.settleCustomerDebts(data);
  } catch (error) {
    console.error('IPC: Error settling customer debts:', error);
    throw error;
  }
});

// Customer order history (optional filter by customerId)
ipcMain.handle('get-customer-order-history', async (_evt, customerId?: number) => {
  try {
    return await dbManager.getCustomerOrderHistory(customerId);
  } catch (error) {
    console.error('IPC: Error getting customer order history:', error);
    throw error;
  }
});


ipcMain.handle('add-customer', async (event, customerData) => {
  try {
    return await dbManager.createCustomer(customerData);
  } catch (error) {
    console.error('IPC: Error adding customer:', error);
    throw error;
  }
});

ipcMain.handle('update-customer', async (event, { id, customerData }) => {
  try {
    return await dbManager.updateCustomer(id, customerData);
  } catch (error) {
    console.error('IPC: Error updating customer:', error);
    throw error;
  }
});

ipcMain.handle('get-menu-items', async () => {
  return await dbManager.getMenuItems();
});

ipcMain.handle('create-order', async (event, orderData) => {
  return await dbManager.createOrder(orderData);
});


ipcMain.handle('create-user', async(event,userData) => {
  return await dbManager.createUser(userData);
});

ipcMain.handle('get-orders', async () => {
  return await dbManager.getOrders();
});

ipcMain.handle('process-payment', async (event, paymentData) => {
  return await dbManager.processPayment(paymentData);
});
// User management handlers
ipcMain.handle('authenticate-user', async (event, { username, password }) => {
  return await dbManager.authenticateUser(username, password);
});


// Table categories management handlers
ipcMain.handle('get-table-categories', async () => {
  return await dbManager.getTableCategories();
});

ipcMain.handle('create-table-category', async (event, categoryData) => {
  try {
    console.log('IPC: Creating table category:', categoryData);
    const result = await dbManager.createTableCategory(categoryData);
    console.log('IPC: Table category created successfully:', result);
    return result;
  } catch (error) {
    console.error('IPC: Error creating table category:', error);
    throw error;
  }
});

ipcMain.handle('update-table-category', async (event, { id, categoryData }) => {
  return await dbManager.updateTableCategory(id, categoryData);
});

ipcMain.handle('delete-table-category', async (event, id) => {
  return await dbManager.deleteTableCategory(id);
});


ipcMain.handle('delete-user',async(event,id) =>{
    return await dbManager.deleteUser(id);
});

ipcMain.handle('delete-user-hard', async (event, id) => {
  return await dbManager.deleteUserHard(id);
});

ipcMain.handle('update-user', async (event, { id, userData }) => {
  console.log('IPC: update-user called with id=', id, 'userData=', userData && typeof userData === 'object' ? { ...userData, password: userData.password ? '<<redacted>>' : undefined } : userData);
  try {
    const result = await dbManager.updateUser(id, userData);
    console.log('IPC: update-user succeeded for id=', id);
    return result;
  } catch (error) {
    console.error('IPC: Error in update-user handler:', error);
    throw error;
  }
});




// Table management handlers
ipcMain.handle('create-table', async (event, tableData) => {
  try {
    console.log('IPC: Creating table:', tableData);
    return await dbManager.createTable(tableData);
  } catch (error) {
    console.error('IPC: Error creating table:', error);
    throw error;
  }
});

ipcMain.handle('update-table', async (event, { id, tableData }) => {
  try {
    console.log('IPC: Updating table:', id, tableData);
    return await dbManager.updateTable(id, tableData);
  } catch (error) {
    console.error('IPC: Error updating table:', error);
    throw error;
  }
});

ipcMain.handle('delete-table', async (event, id) => {
  try {
    console.log('IPC: Deleting table:', id);
    return await dbManager.deleteTable(id);
  } catch (error) {
    console.error('IPC: Error deleting table:', error);
    throw error;
  }
});

// Menu items management handlers
ipcMain.handle('create-menu-item', async (event, itemData) => {
  try {
    console.log('IPC: Creating menu item:', itemData);
    return await dbManager.createMenuItem(itemData);
  } catch (error) {
    console.error('IPC: Error creating menu item:', error);
    throw error;
  }
});

ipcMain.handle('update-menu-item', async (event, { id, itemData }) => {
  try {
    console.log('IPC: Updating menu item:', id, itemData);
    return await dbManager.updateMenuItem(id, itemData);
  } catch (error) {
    console.error('IPC: Error updating menu item:', error);
    throw error;
  }
});

ipcMain.handle('delete-menu-item', async (event, id) => {
  try {
    console.log('IPC: Deleting menu item:', id);
    return await dbManager.deleteMenuItem(id);
  } catch (error) {
    console.error('IPC: Error deleting menu item:', error);
    throw error;
  }
});

// Menu categories management handlers
ipcMain.handle('get-menu-categories', async () => {
  try {
    console.log('IPC: Getting menu categories');
    return await dbManager.getMenuCategories();
  } catch (error) {
    console.error('IPC: Error getting menu categories:', error);
    throw error;
  }
});

ipcMain.handle('create-menu-category', async (event, categoryData) => {
  try {
    console.log('IPC: Creating menu category:', categoryData);
    const result = await dbManager.createMenuCategory(categoryData);
    console.log('IPC: Menu category created successfully:', result);
    return result;
  } catch (error) {
    console.error('IPC: Error creating menu category:', error);
    throw error;
  }
});

ipcMain.handle('update-menu-category', async (event, { id, categoryData }) => {
  try {
    console.log('IPC: Updating menu category:', id, categoryData);
    return await dbManager.updateMenuCategory(id, categoryData);
  } catch (error) {
    console.error('IPC: Error updating menu category:', error);
    throw error;
  }
});

ipcMain.handle('delete-menu-category', async (event, id) => {
  try {
    console.log('IPC: Deleting menu category:', id);
    return await dbManager.deleteMenuCategory(id);
  } catch (error) {
    console.error('IPC: Error deleting menu category:', error);
    throw error;
  }
});

// Admin window handlers
ipcMain.handle('open-admin-window', async () => {
  try {
    if (adminWindow) {
      adminWindow.focus();
      return;
    }

    adminWindow = new BrowserWindow({
      width: 400,
      height: 300,
      modal: true,
      parent: mainWindow,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      adminWindow.loadURL('http://localhost:3002/#/admin-verify');
    } else {
      adminWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: '/admin-verify'
      });
    }

    adminWindow.once('closed', () => {
      adminWindow = null;
    });

  } catch (error) {
    console.error('Error opening admin window:', error);
    throw error;
  }
});

ipcMain.handle('admin-verified', async () => {
  try {
    if (adminWindow) {
      adminWindow.close();
    }
    mainWindow.webContents.send('admin-verification-success');
  } catch (error) {
    console.error('Error handling admin verification:', error);
    throw error;
  }
});

ipcMain.handle('close-admin-window', async () => {
  if (adminWindow) {
    adminWindow.close();
  }
});

// Admin password window handler
ipcMain.handle('open-admin-password', async () => {
  try {
    if (adminPasswordWindow) {
      adminPasswordWindow.focus();
      return;
    }

    adminPasswordWindow = new BrowserWindow({
      width: 400,
      height: 600,
      modal: true,
      parent: mainWindow,
      resizable: false,
      minimizable: false,
      maximizable: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      adminPasswordWindow.loadURL('http://localhost:3002/#/admin-password');
    } else {
      adminPasswordWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: '/admin-password'
      });
    }

    adminPasswordWindow.once('closed', () => {
      adminPasswordWindow = null;
    });

  } catch (error) {
    console.error('Error opening admin password window:', error);
    throw error;
  }
});

ipcMain.handle('admin-password-success', async () => {
  try {
    if (adminPasswordWindow) {
      adminPasswordWindow.close();
    }
    mainWindow.webContents.send('admin-verification-success');
  } catch (error) {
    console.error('Error handling admin password success:', error);
    throw error;
  }
});

ipcMain.handle('close-admin-password', async () => {
  if (adminPasswordWindow) {
    adminPasswordWindow.close();
  }
});

// Password window handler
ipcMain.handle('open-password-window', async () => {
  try {
    if (passwordWindow) {
      passwordWindow.focus();
      return;
    }

    passwordWindow = new BrowserWindow({
      width: 400,
      height: 500,
      modal: true,
      parent: mainWindow,
      resizable: false,
      minimizable: false,
      maximizable: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load the password entry HTML file
    passwordWindow.loadFile(path.join(__dirname, '../renderer/password.html'));

    passwordWindow.once('closed', () => {
      passwordWindow = null;
    });

  } catch (error) {
    console.error('Error opening password window:', error);
    throw error;
  }
});

ipcMain.handle('verify-admin-password', async (event, password) => {
  try {
    const user = await dbManager.authenticateUser('admin', password);
    if (user && (user.role === 'manager' || user.role === 'cashier')) {
      if (passwordWindow) {
        passwordWindow.close();
      }
      mainWindow.webContents.send('admin-verification-success');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw error;
  }
});



ipcMain.handle('get-revenue-data', async (event, params) => {
  try {
    return await dbManager.getRevenueData(params);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    throw error;
  }
});

ipcMain.handle('close-password-window', () => {
  if (passwordWindow) {
    passwordWindow.close();
  }
});

ipcMain.handle('update-order-status', async (event, { orderId, status }) => {
  return await dbManager.updateOrderStatus(orderId, status);
});

ipcMain.handle('delete-order', async (event, orderId) => {
  try {
    return await dbManager.deleteOrder(orderId);
  } catch (error) {
    console.error('IPC: Error deleting order:', error);
    throw error;
  }
});

ipcMain.handle('get-past-orders', async () => {
  try {
    return await dbManager.getPastOrders();
  } catch (error) {
    console.error('IPC: Error getting past orders:', error);
    throw error;
  }
});

// Cash session IPC
ipcMain.handle('cash-status', async () => {
  return await dbManager.getCashStatus();
});
ipcMain.handle('cash-open', async (e, { user, openingAmount }) => {
  return await dbManager.openCashSession(user, openingAmount);
});
ipcMain.handle('cash-close', async (e, { user, realCash }) => {
  return await dbManager.closeCashSession(user, realCash);
});

// IPC to open cash window
ipcMain.handle('open-cash-window', async (e, mode: 'open' | 'close') => {
  createCashWindow(mode);
});

// Ürün satış raporu (tarih aralığı ve sıralama ile)
ipcMain.handle('get-product-sales', async (event, { start, end, orderBy }) => {
  return await dbManager.getProductSales({ start, end, orderBy });
});
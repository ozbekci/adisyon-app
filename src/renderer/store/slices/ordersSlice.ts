import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import '../../../shared/types'; // Import global types

export interface OrderItem {
  id: number;
  menuItemId: number;
  quantity: number;
  notes?: string;
  price: number;
  name?: string;
  description?: string;
}

export interface Order {
  id: number;
  tableId: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
  payment_status: 'unpaid' | 'paid' | 'debt';
  total: number;
  created_at: string;
  updatedAt: string;
  table_number?: string;
}

interface OrdersState {
  orders: Order[];
  currentOrder: OrderItem[];
  currentTableId: number | null;
  currentTable: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: [],
  currentTableId: null,
  currentTable: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async () => {
    console.log('Fetching orders from database...');
    const orders = await window.electronAPI.getOrders();
    // Tüm tarih alanlarını string'e dönüştür
    const safeOrders = orders.map((order: any) => ({
      ...order,
      created_at:
        typeof order.created_at === 'string'
          ? order.created_at
          : (order.created_at && Object.prototype.toString.call(order.created_at) === '[object Date]')
            ? (order.created_at as Date).toISOString()
            : '',
      paid_at:
        typeof order.paid_at === 'string'
          ? order.paid_at
          : (order.paid_at && Object.prototype.toString.call(order.paid_at) === '[object Date]')
            ? (order.paid_at as Date).toISOString()
            : '',
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            ...item,
            created_at:
              typeof item.created_at === 'string'
                ? item.created_at
                : (item.created_at && Object.prototype.toString.call(item.created_at) === '[object Date]')
                  ? (item.created_at as Date).toISOString()
                  : '',
          }))
        : [],
    }));
    console.log('Received orders:', safeOrders);
    return safeOrders;
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: { tableId?: number; items: OrderItem[]; orderType?: string; paymentMethod?: string,customerName?: string }) => {
    const order = await window.electronAPI.createOrder(orderData);
    // Tüm tarih alanlarını string'e dönüştür
    const safeOrder = {
      ...order,
      created_at:
        typeof order.created_at === 'string'
          ? order.created_at
          : (order.created_at && Object.prototype.toString.call(order.created_at) === '[object Date]')
            ? (order.created_at as Date).toISOString()
            : '',
      paid_at:
        typeof order.paid_at === 'string'
          ? order.paid_at
          : (order.paid_at && Object.prototype.toString.call(order.paid_at) === '[object Date]')
            ? (order.paid_at as Date).toISOString()
            : '',
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            ...item,
            created_at:
              typeof item.created_at === 'string'
                ? item.created_at
                : (item.created_at && Object.prototype.toString.call(item.created_at) === '[object Date]')
                  ? (item.created_at as Date).toISOString()
                  : '',
            
          }))
        : [],
    };
    return safeOrder;
  }
);

export const updateOrderStatusAsync = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }: { id: number; status: Order['status'] }) => {
    const updatedOrder = await window.electronAPI.updateOrderStatus(id, status);
    const safeOrder = {
      ...updatedOrder,
      created_at:
        typeof updatedOrder?.created_at === 'string'
          ? updatedOrder.created_at
          : (updatedOrder?.created_at && Object.prototype.toString.call(updatedOrder.created_at) === '[object Date]')
            ? (updatedOrder.created_at as Date).toISOString()
            : '',
      items: Array.isArray(updatedOrder.items)
        ? updatedOrder.items.map((item: any) => ({
            ...item,
            created_at:
              typeof item.created_at === 'string'
                ? item.created_at
                : (item.created_at && Object.prototype.toString.call(item.created_at) === '[object Date]')
                  ? (item.created_at as Date).toISOString()
                  : '',
          }))
        : [],
    };
    return { id, status, updatedOrder: safeOrder };
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addToCurrentOrder: (state, action: PayloadAction<{ menuItem: any; quantity: number; notes?: string }>) => {
      const { menuItem, quantity, notes } = action.payload;
      const existingItem = state.currentOrder.find(item => item.menuItemId === menuItem.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.currentOrder.push({
          id: Date.now(), // Temporary ID
          menuItemId: menuItem.id,
          quantity,
          notes,
          price: menuItem.price,
          name: menuItem.name,
          description: menuItem.description,
        });
      }
    },
    removeFromCurrentOrder: (state, action: PayloadAction<number>) => {
      state.currentOrder = state.currentOrder.filter(item => item.id !== action.payload);
    },   updateOrderItemQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      // 1. current Order
      const item = state.currentOrder.find(item => item.id === action.payload.id);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.currentOrder = state.currentOrder.filter(item => item.id !== action.payload.id);
        } else {
          item.quantity = action.payload.quantity;
        } 
      }
      // 2. orders array'inde tüm orderlarda item'i bul ve güncelle
      state.orders = state.orders.map(order => {
        const updatedItems = order.items.map(orderItem => {
          if (orderItem.id === action.payload.id) {
            return {
              ...orderItem,
              quantity: action.payload.quantity,
            };
          }
          return orderItem;
        }).filter(item => item.quantity > 0);
        return {
          ...order,
          items: updatedItems,
        };
      });
    },
    setCurrentTableId: (state, action: PayloadAction<number | null>) => {
      state.currentTableId = action.payload;
    },
    setCurrentTable: (state, action: PayloadAction<any | null>) => {
      state.currentTable = action.payload;
      state.currentTableId = action.payload ? action.payload.id : null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = [];
      state.currentTableId = null;
      state.currentTable = null;
    },
    updateOrderStatus: (state, action: PayloadAction<{ id: number; status: Order['status'] }>) => {
      const order = state.orders.find(o => o.id === action.payload.id);
      if (order) {
        order.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
        state.currentOrder = [];
        state.currentTableId = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create order';
      })
      .addCase(updateOrderStatusAsync.fulfilled, (state, action) => {
        const order = state.orders.find(o => o.id === action.payload.id);
        if (order) order.status = action.payload.status;
      });
  },
});

export const {
  addToCurrentOrder,
  removeFromCurrentOrder,
  updateOrderItemQuantity,
  setCurrentTableId,
  setCurrentTable,
  clearCurrentOrder,
  updateOrderStatus,
} = ordersSlice.actions;

export default ordersSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Order, OrderItem } from '../../../shared/types';

interface PastOrdersState {
  pastOrders: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: PastOrdersState = {
  pastOrders: [],
  loading: false,
  error: null,
};

export const fetchPastOrders = createAsyncThunk('pastOrders/fetchPastOrders', async () => {
  try {
    console.log('Fetching past orders...');
    const result = await window.electronAPI.getPastOrders();
    // Tüm tarih alanlarını string'e dönüştür
    const safeOrders = result.map((order: any) => ({
      ...order,
      paid_at:
        typeof order.paid_at === 'string'
          ? order.paid_at
          : (order.paid_at && Object.prototype.toString.call(order.paid_at) === '[object Date]')
            ? (order.paid_at as Date).toISOString()
            : '',
      created_at:
        typeof order.created_at === 'string'
          ? order.created_at
          : (order.created_at && Object.prototype.toString.call(order.created_at) === '[object Date]')
            ? (order.created_at as Date).toISOString()
            : '',
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            ...item,
            createdAt:
              typeof item.createdAt === 'string'
                ? item.createdAt
                : (item.createdAt && Object.prototype.toString.call(item.createdAt) === '[object Date]')
                  ? (item.createdAt as Date).toISOString()
                  : '',
          }))
        : [],
    }));
    console.log('Past orders fetched:', safeOrders);
    return safeOrders;
  } catch (error) {
    console.error('Error fetching past orders:', error);
    throw error;
  }
});

const pastOrdersSlice = createSlice({
  name: 'pastOrders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPastOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPastOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.pastOrders = action.payload;
      })
      .addCase(fetchPastOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch past orders';
      });
  },
});

export default pastOrdersSlice.reducer; 
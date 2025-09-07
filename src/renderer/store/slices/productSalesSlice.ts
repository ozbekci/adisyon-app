import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface ProductSale {
  menu_item_id: number;
  name: string;
  total_quantity: number;
  total_revenue: number;
}

interface ProductSalesState {
  sales: ProductSale[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductSalesState = {
  sales: [],
  loading: false,
  error: null,
};

export const fetchProductSales = createAsyncThunk('productSales/fetch', async (params: { start?: string; end?: string; orderBy?: 'quantity' | 'revenue' }) => {
  return await window.electronAPI.getProductSales(params);
});

const productSalesSlice = createSlice({
  name: 'productSales',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload;
      })
      .addCase(fetchProductSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch product sales';
      });
  },
});

export default productSalesSlice.reducer; 
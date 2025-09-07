import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import '../../../shared/types'; // Import global types

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}

interface MenuState {
  items: MenuItem[];
  categories: string[];
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
}

const initialState: MenuState = {
  items: [],
  categories: [],
  loading: false,
  error: null,
  selectedCategory: null,
};

// Async thunks
export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async () => {
    console.log('Fetching menu items from database...');
    const items = await window.electronAPI.getMenuItems();
    // created_at alanını string'e dönüştür
    const safeItems = items.map((item: any) => ({
      ...item,
      created_at:
        typeof item.created_at === 'string'
          ? item.created_at
          : (item.created_at && Object.prototype.toString.call(item.created_at) === '[object Date]')
            ? (item.created_at as Date).toISOString()
            : '',
    }));
    console.log('Received menu items:', safeItems);
    return safeItems;
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    selectCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    toggleItemAvailability: (state, action: PayloadAction<number>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item) {
        item.available = !item.available;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // Extract unique categories
        state.categories = [...new Set(action.payload.map((item: MenuItem) => item.category))];
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch menu items';
      });
  },
});

export const { selectCategory, toggleItemAvailability } = menuSlice.actions;
export default menuSlice.reducer;

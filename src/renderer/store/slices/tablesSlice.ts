import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import '../../../shared/types'; // Import global types

export interface Table {
  id: number;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  x?: number;
  y?: number;
}

interface TablesState {
  tables: Table[];
  loading: boolean;
  error: string | null;
  selectedTable: Table | null;
}

const initialState: TablesState = {
  tables: [],
  loading: false,
  error: null,
  selectedTable: null,
};

// Async thunks
export const fetchTables = createAsyncThunk(
  'tables/fetchTables',
  async () => {
    console.log('Fetching tables from database...');
    const tables = await window.electronAPI.getTables();
    console.log('Received tables:', tables);
    return tables;
  }
);

const tablesSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    selectTable: (state, action: PayloadAction<Table>) => {
      state.selectedTable = action.payload;
    },
    clearSelectedTable: (state) => {
      state.selectedTable = null;
    },
    updateTableStatus: (state, action: PayloadAction<{ id: number; status: Table['status'] }>) => {
      const table = state.tables.find(t => t.id === action.payload.id);
      if (table) {
        table.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tables';
      });
  },
});

export const { selectTable, clearSelectedTable, updateTableStatus } = tablesSlice.actions;
export default tablesSlice.reducer;

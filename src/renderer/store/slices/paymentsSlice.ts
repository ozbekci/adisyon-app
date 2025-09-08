import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import '../../../shared/types'; // Import global types

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: import('../../../shared/types').PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface PaymentsState {
  payments: Payment[];
  dailyTotal: number;
  loading: boolean;
  error: string | null;
}

const initialState: PaymentsState = {
  payments: [],
  dailyTotal: 0,
  loading: false,
  error: null,
};

// Async thunks
export const processPayment = createAsyncThunk(
  'payments/processPayment',
  async (paymentData: { orderId: number; amount: number; method: import('../../../shared/types').PaymentMethod }) => {
    return await window.electronAPI.processPayment(paymentData);
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.unshift(action.payload);
      state.dailyTotal += action.payload.amount;
    },
    updateDailyTotal: (state, action: PayloadAction<number>) => {
      state.dailyTotal = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading = false;
        // Payment processed successfully
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to process payment';
      });
  },
});

export const { addPayment, updateDailyTotal } = paymentsSlice.actions;
export default paymentsSlice.reducer;

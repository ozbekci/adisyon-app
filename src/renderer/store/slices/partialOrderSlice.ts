import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PartialPayment {
  orderId: number;
  cash: number;
  credit_kart: number;
  ticket: number;
  paid_order_items?: {itemId:number ; quantity:number}[];
}
interface PartialOrderState {
  payments: PartialPayment[];
}

const initialState: PartialOrderState = {
  payments: [],
};

const partialOrderSlice = createSlice({
  name: "partialOrder",
  initialState,
  reducers: {
    addPartialPayment: (state, action: PayloadAction<PartialPayment>) => {
      const idx = state.payments.findIndex(p => p.orderId === action.payload.orderId);
      if (idx > -1) {
        state.payments[idx].cash += action.payload.cash;
        state.payments[idx].credit_kart += action.payload.credit_kart;
        state.payments[idx].ticket += action.payload.ticket;
      } else {
        state.payments.push(action.payload);
      }
    },
    addPaidOrderItems: (state, action: PayloadAction<PartialPayment>) => {
      const idx = state.payments.findIndex(p => p.orderId === action.payload.orderId);
      if (idx > -1) {

        state.payments[idx].cash += action.payload.cash;
        state.payments[idx].credit_kart += action.payload.credit_kart;
        state.payments[idx].ticket += action.payload.ticket;

        if (!state.payments[idx].paid_order_items) {
          state.payments[idx].paid_order_items = [];
        }
        action.payload.paid_order_items!.forEach(newItem => {
          const existing = state.payments[idx].paid_order_items!.find(i =>  i.itemId === newItem.itemId);
          if (existing) {
            existing.quantity += newItem.quantity;
          } else {
            state.payments[idx].paid_order_items!.push(newItem );
          }
        });
        console.log(state.payments[idx].paid_order_items!)
      } else {
        // Eğer ilgili orderId yoksa yeni bir PartialPayment objesi ekle
        state.payments.push({
          orderId: action.payload.orderId,
          cash: action.payload.cash,
          credit_kart: action.payload.credit_kart,
          ticket: action.payload.ticket,
          paid_order_items: [...action.payload.paid_order_items!],
        });
        console.log('Yeni sipariş eklendi:', state.payments[idx]);
      }
    },
    clearPartialPayment: (state, action: PayloadAction<number>) => {
      state.payments = state.payments.filter(p => p.orderId !== action.payload);
    },
    resetPartialPayments: (state) => {
      state.payments = [];
    },
  },
});

export const { addPartialPayment, clearPartialPayment, resetPartialPayments,addPaidOrderItems } = partialOrderSlice.actions;
// Selector: get total partial payment for an order
export const selectPartialPaymentTotal = (state: PartialOrderState, orderId: number) => {
  const payment = state.payments.find(p => p.orderId === orderId);
  if (!payment) return 0;
  return (payment.cash || 0) + (payment.credit_kart || 0) + (payment.ticket || 0);
};
export default partialOrderSlice.reducer;

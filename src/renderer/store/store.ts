import { configureStore } from '@reduxjs/toolkit';
import tablesSlice from './slices/tablesSlice';
import menuSlice from './slices/menuSlice';
import ordersSlice from './slices/ordersSlice';
import paymentsSlice from './slices/paymentsSlice';
import authSlice from './slices/authSlice';
import usersSlice from './slices/usersSlice';
import pastOrdersSlice from './slices/pastOrdersSlice';
import productSalesSlice from './slices/productSalesSlice';
import partialOrderSlice from './slices/partialOrderSlice'
      
export const store = configureStore({
  reducer: {
    auth: authSlice,
    partialOrder: partialOrderSlice,
    users: usersSlice,
    tables: tablesSlice,
    menu: menuSlice,
    orders: ordersSlice,
    payments: paymentsSlice,
    pastOrders: pastOrdersSlice,
    productSales: productSalesSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

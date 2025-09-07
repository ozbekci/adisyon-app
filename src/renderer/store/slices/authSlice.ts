import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../../shared/types';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};


// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const user = await window.electronAPI.authenticateUser(username, password);
      if (!user) {
        return rejectWithValue('Kullanıcı adı veya şifre hatalı');
      }
      // Tüm tarih alanlarını string'e dönüştür
      const safeUser = {
        ...user,
        createdAt:
          typeof user.createdAt === 'string'
            ? user.createdAt
            : (user.createdAt && Object.prototype.toString.call(user.createdAt) === '[object Date]')
              ? (user.createdAt as Date).toISOString()
              : '', 
        lastLogin:
          typeof user.lastLogin === 'string'
            ? user.lastLogin
            : (user.lastLogin && Object.prototype.toString.call(user.lastLogin) === '[object Date]')
              ? (user.lastLogin as Date).toISOString()
              : '',
      };
      return safeUser;
    } catch (error) {
      return rejectWithValue('Giriş sırasında bir hata oluştu');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload;
        state.currentUser = user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.currentUser = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

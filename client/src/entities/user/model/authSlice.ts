import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from './types';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialLoading: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isInitialLoading = false;
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = !!action.payload;
    },

    setInitialLoading: (state, action: PayloadAction<boolean>) => {
      state.isInitialLoading = action.payload;
    },

    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitialLoading = false;
    },
  },

  selectors: {
    selectCurrentUser: (state) => state.user,
    selectAccessToken: (state) => state.accessToken,
    selectIsAuthenticated: (state) => state.isAuthenticated,
    selectIsInitialLoading: (state) => state.isInitialLoading,
  },
});

export const { setAuth, setAccessToken, setInitialLoading, clearAuth } = authSlice.actions;

export const {
  selectCurrentUser,
  selectAccessToken,
  selectIsAuthenticated,
  selectIsInitialLoading,
} = authSlice.selectors;

export default authSlice.reducer;

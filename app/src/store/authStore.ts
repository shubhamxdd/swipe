import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { exchangeCode, refreshToken } from '../services/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setTokens: (access: string, refresh: string) => Promise<void>;
  exchangeCode: (code: string, codeVerifier: string) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  logout: () => Promise<void>;
  loadTokens: () => Promise<void>;
}

const ACCESS_KEY = 'spotify_access_token';
const REFRESH_KEY = 'spotify_refresh_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  exchangeCode: async (code, codeVerifier) => {
    const tokens = await exchangeCode(code, codeVerifier);
    await get().setTokens(tokens.access_token, tokens.refresh_token);
  },

  refreshAccessToken: async () => {
    const refresh = get().refreshToken;
    if (!refresh) return;

    try {
      const tokens = await refreshToken(refresh);
      await SecureStore.setItemAsync(ACCESS_KEY, tokens.access_token);
      set({ accessToken: tokens.access_token });
    } catch {
      await get().logout();
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadTokens: async () => {
    try {
      const access = await SecureStore.getItemAsync(ACCESS_KEY);
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
      set({
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: !!access && !!refresh,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'user' | 'agent' | 'admin';
  avatar?: string;
  agentProfile?: {
    licenseNumber?: string;
    agency?: string;
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  };
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  hydrated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login(email, password);
      await AsyncStorage.setItem('token', res.accessToken);
      set({ user: res.data.user, token: res.accessToken, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signup: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.signup(data);
      await AsyncStorage.setItem('token', res.accessToken);
      set({ user: res.data.user, token: res.accessToken, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await authAPI.logout();
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) { set({ hydrated: true }); return; }
    set({ isLoading: true });
    try {
      const res = await authAPI.getMe();
      set({ user: res.data.user, token, isAuthenticated: true, isLoading: false, hydrated: true });
    } catch {
      await AsyncStorage.removeItem('token');
      set({ isLoading: false, isAuthenticated: false, hydrated: true });
    }
  },
}));

// frontend/src/stores/authStore.js
import { create } from 'zustand';
import api from '../config/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // ✅ Initialize auth state from localStorage
  initAuth: () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        set({ 
          isAuthenticated: true, 
          user: parsedUser,
          isLoading: false 
        });
        console.log('✅ Auth initialized:', parsedUser.username);
        return true;
      }
      
      set({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false 
      });
      return false;
    } catch (error) {
      console.error('❌ Init auth error:', error);
      set({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false 
      });
      return false;
    }
  },

  // ✅ Login
  login: async (username, password) => {
    try {
      // Step 1: Get token
      const tokenResponse = await api.post('/auth/login/', { 
        username, 
        password 
      });

      const { tokens, user: userData } = tokenResponse.data;

      // Step 2: Save to localStorage
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      // Step 3: Update store
      set({ 
        isAuthenticated: true, 
        user: userData 
      });

      console.log('✅ Login success:', userData.username);
      return { success: true };

    } catch (error) {
      console.error('❌ Login error:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  // ✅ Set auth after email verification (untuk register flow)
  setAuth: (userData, tokens) => {
    try {
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      set({ 
        isAuthenticated: true, 
        user: userData 
      });

      console.log('✅ Auth set:', userData.username);
      return true;
    } catch (error) {
      console.error('❌ Set auth error:', error);
      return false;
    }
  },

  // ✅ Logout
  logout: () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      set({ 
        isAuthenticated: false, 
        user: null 
      });

      console.log('✅ Logout success');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  },

  // ✅ Update user data
  updateUser: (userData) => {
    try {
      // Merge dengan data user yang ada
      set((state) => {
        const updatedUser = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      });

      console.log('✅ User updated');
    } catch (error) {
      console.error('❌ Update user error:', error);
    }
  },

  // ✅ Refresh user data from server
  refreshUser: async () => {
    try {
      const response = await api.get('/users/me/');
      const userData = response.data;

      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData });

      console.log('✅ User refreshed');
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Refresh user error:', error);
      return { success: false, error: error.response?.data };
    }
  },
}));

export default useAuthStore;
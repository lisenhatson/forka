import { create } from 'zustand';
import api from '../config/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth state from localStorage
  initAuth: () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      set({ 
        isAuthenticated: true, 
        user: JSON.parse(userData),
        isLoading: false 
      });
      return true;
    }
    
    set({ isLoading: false });
    return false;
  },

  // Login
  login: async (username, password) => {
    try {
      const response = await api.post('/token/', { username, password });
      const { access, refresh } = response.data;

      // Save tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Get user data
      const userResponse = await api.get('/users/me/');
      const userData = userResponse.data;

      localStorage.setItem('user', JSON.stringify(userData));

      set({ 
        isAuthenticated: true, 
        user: userData 
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  },

  // Register
  register: async (formData) => {
    try {
      const response = await api.post('/register/', formData);
      const { user, tokens } = response.data;

      // Save tokens
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(user));

      set({ 
        isAuthenticated: true, 
        user: user 
      });

      return { success: true };
    } catch (error) {
      const errorData = error.response?.data;
      return { 
        success: false, 
        errors: errorData || { message: 'Registration failed' }
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    set({ 
      isAuthenticated: false, 
      user: null 
    });
  },

  // Update user data
  updateUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },
}));

export default useAuthStore;
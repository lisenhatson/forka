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

  // ✅ Login — step 1 of 2 (username/password)
  // On success this does NOT log the user in yet. The backend has emailed
  // an MFA code and returned a temp_token. Call verifyLoginMfa() next.
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login/', {
        username,
        password
      });

      const { mfa_required, temp_token, email } = response.data;

      if (mfa_required) {
        console.log('ℹ️ Password OK, MFA code sent to', email);
        return {
          success: false,
          mfaRequired: true,
          tempToken: temp_token,
          email,
        };
      }

      // Shouldn't normally happen (backend always requires MFA now), but
      // keep this as a safety net in case that ever changes server-side.
      return { success: false, error: 'Unexpected login response' };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  },

  // ✅ Login — step 2 of 2 (verify the MFA code, actually sign in)
  verifyLoginMfa: async (tempToken, code) => {
    try {
      const response = await api.post('/auth/verify-login-mfa/', {
        temp_token: tempToken,
        code
      });
      const { tokens, user: userData } = response.data;

      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      set({
        isAuthenticated: true,
        user: userData
      });

      console.log('✅ MFA verified, login success:', userData.username);
      return { success: true };
    } catch (error) {
      console.error('❌ Verify MFA error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid or expired code'
      };
    }
  },

  // ✅ Resend the MFA code mid-login; returns a fresh temp_token
  resendLoginMfa: async (tempToken) => {
    try {
      const response = await api.post('/auth/resend-login-mfa/', {
        temp_token: tempToken
      });
      return { success: true, tempToken: response.data.temp_token };
    } catch (error) {
      console.error('❌ Resend MFA error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to resend code'
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

// src/services/authService.js
import { API_BASE_URL } from '../utils/constants';

export const authService = {
  // Инициализация Google Sign-In
  initGoogleAuth: (onSuccess, onError) => {
    if (typeof window === 'undefined') return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            await authService.handleGoogleLogin(response.credential, onSuccess, onError);
          } catch (error) {
            onError(error);
          }
        },
        auto_select: false,
      });
    };
    document.head.appendChild(script);
  },

  // Обработка логина через Google
  handleGoogleLogin: async (googleToken, onSuccess, onError) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      onSuccess(data.user, data.accessToken);
    } catch (error) {
      onError(error);
    }
  },

  // Выход из системы
  logout: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};
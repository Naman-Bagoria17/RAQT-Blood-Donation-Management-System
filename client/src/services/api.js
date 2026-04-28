import axios from 'axios';

/**
 * Axios instance pre-configured with base URL.
 * In development, Vite's proxy forwards /api → http://localhost:5000
 * so baseURL can simply be '/api'.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ── Request Interceptor ─────────────────────────────────────────
// Attach JWT token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bloodconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────
// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bloodconnect_token');
      localStorage.removeItem('bloodconnect_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

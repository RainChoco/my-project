import axios from 'axios';

export const AUTH_TOKEN_KEY = 'authToken';

// Falls back to localhost in dev and the Render backend in production, so a
// missing VITE_API_BASE_URL on Vercel doesn't silently resolve to a relative
// path (which Vercel has no rewrite for and returns index.html for).
const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://my-project-3j4a.onrender.com/api';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  // axios uses a plain object for headers; set the property directly
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

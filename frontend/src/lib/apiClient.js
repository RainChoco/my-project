import axios from 'axios';

export const AUTH_TOKEN_KEY = 'authToken';

const apiClient = axios.create({
  // Use the Vite dev-server proxy (/api → http://127.0.0.1:5000/api).
  // In production, set VITE_API_BASE_URL to the deployed backend URL.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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

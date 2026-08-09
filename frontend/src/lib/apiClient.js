import axios from 'axios';

export const AUTH_TOKEN_KEY = 'authToken';

// Falls back to localhost in dev and the Render backend in production, so a
// missing VITE_API_BASE_URL on Vercel doesn't silently resolve to a relative
// path (which Vercel has no rewrite for and returns index.html for).
const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://my-project-3j4a.onrender.com/api';

// Exported so the handful of modules that use raw fetch() instead of apiClient
// (proposalApi.js, historyApi.js, historyStorage.js) resolve the same base URL
// instead of each keeping their own "?? '/api'" fallback - which broke in
// production the exact same way apiClient's bare '/api' fallback used to.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

// Render's free tier spins the backend down after inactivity, and the first
// request after a cold spell can take 30-50s while the instance boots. A
// generous default timeout keeps that from aborting client-side before Render
// even gets a chance to respond.
export const DEFAULT_TIMEOUT_MS = 20000;
const COLD_START_RETRY_DELAY_MS = 4000;
const COLD_START_MAX_RETRIES = 2;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Cold-start reconnect: retry a request that never got a response at all.
    // Restricted to error.code !== 'ECONNABORTED' (our own client-side timeout)
    // because that means the request was already sent and may be mid-flight on
    // the server - blindly retrying a POST/PATCH/DELETE there risks duplicating
    // whatever it was doing (e.g. creating a second tender). A true network
    // failure (DNS/refused/CORS-preflight rejection) means the server never
    // saw the request, so retrying is always safe regardless of method.
    // Callers that specifically want to retry through a timeout too (e.g.
    // login, where retrying has no harmful side effect) can opt in with
    // `{ retryOnColdStart: true }` on that request's config.
    const canRetry =
      config && !error.response && (error.code !== 'ECONNABORTED' || config.retryOnColdStart);

    if (canRetry) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < COLD_START_MAX_RETRIES) {
        config.__retryCount += 1;
        await wait(COLD_START_RETRY_DELAY_MS * config.__retryCount);
        return apiClient(config);
      }
    }

    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

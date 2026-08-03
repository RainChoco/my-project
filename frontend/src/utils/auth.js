/**
 * auth.js — Centralised authentication utilities
 *
 * All auth state lives in localStorage:
 *   authToken → JWT string
 *   authUser  → JSON-serialised user object { id, full_name, email, role }
 *
 * API response shape (verified against authController.js + authService.js):
 *   POST /api/auth/login → { status: 'success', data: { token, user } }
 *   user: { id, full_name, email, role }
 */

const TOKEN_KEY = 'authToken';
const USER_KEY  = 'authUser';

// ── Read ──────────────────────────────────────────────────────────────────────

/** Returns the raw JWT string, or null if not present. */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Returns the stored user object, or null.
 * Shape: { id, full_name, email, role }
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Returns true if a token is present (does not verify expiry). */
export const isAuthenticated = () => Boolean(getToken());

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Persists the token and user returned by POST /api/auth/login.
 * Call this after a successful login response — do NOT call directly from components.
 * @param {{ token: string, user: object }} session
 */
export const persistSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Clears all auth state from localStorage.
 * Does NOT redirect — call navigate('/login') after this.
 */
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ── Axios helper ──────────────────────────────────────────────────────────────

/**
 * Returns the Authorization header value for protected API calls.
 * Usage: axios.get('/api/v1/...', { headers: getAuthHeader() })
 */
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

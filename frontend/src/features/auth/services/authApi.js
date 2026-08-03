import axios from 'axios';
import { persistSession } from '../../../utils/auth';

// Use Vite proxy (/api → http://localhost:5050) — no hardcoded host
const BASE = '/api/auth';

/**
 * Login with email + password.
 *
 * API response (verified against authController.js):
 *   { status: 'success', data: { token, user: { id, full_name, email, role } } }
 *
 * Persists the session automatically and returns the user object.
 */
export const login = async ({ email, password }) => {
  const { data } = await axios.post(`${BASE}/login`, { email, password });
  const session = data.data; // { token, user }
  persistSession(session);
  return session.user;
};

/**
 * Register a new user (admin / seeding use).
 */
export const register = async ({ full_name, email, password, role }) => {
  const { data } = await axios.post(`${BASE}/register`, { full_name, email, password, role });
  return data.data;
};

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

/**
 * PrivateRoute — redirects to /login if the user is not authenticated.
 * Uses isAuthenticated() from utils/auth.js (checks for authToken in localStorage).
 * Preserves the attempted URL in location.state.from so LoginPage can redirect back.
 *
 * Usage:
 *   <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
 */
export default function PrivateRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

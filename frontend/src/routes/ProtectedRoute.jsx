import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context';

// Blocks access to any nested route unless the user has a valid, unexpired JWT.
// Unauthenticated users are bounced to /login, remembering where they were headed.
function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

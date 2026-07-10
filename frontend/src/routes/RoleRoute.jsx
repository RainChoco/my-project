import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context';

// Assumes it's nested under <ProtectedRoute> - only checks role, not auth itself.
// A logged-in user whose role isn't in `roles` gets a 403, not a login redirect.
function RoleRoute({ roles }) {
  const { role } = useAuth();

  if (!roles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;

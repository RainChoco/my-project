import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { routeConfig } from './routeConfig';
import { AppLayout } from '../layouts';
import { LoginPage, ForbiddenPage, NotFoundPage, ShadcnDemoPage } from '../pages';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ui-demo" element={<ShadcnDemoPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/403" element={<ForbiddenPage />} />

        <Route element={<AppLayout />}>
          {routeConfig.map(({ path, roles, element }) => (
            <Route key={path} path={path} element={<RoleRoute roles={roles} />}>
              <Route index element={element} />
            </Route>
          ))}
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;

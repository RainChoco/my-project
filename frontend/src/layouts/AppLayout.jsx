import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { routeConfig } from '../routes/routeConfig';
import { Button } from '../components/ui/button';
import { cn } from '../lib';

// Authenticated app shell: horizontal top nav (filtered to the current user's role) + content.
function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  // `label` is absent on routes that aren't top-level nav items (e.g. a detail
  // route reached by clicking into a list, like /evaluations/:id) - filter
  // those out so the nav bar doesn't render a blank/broken link for them.
  const navItems = routeConfig.filter((route) => route.label && route.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-3">
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium hover:bg-muted',
                  isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium">{user?.full_name}</span>
            <span className="ml-2 text-muted-foreground">({role})</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { routeConfig } from '../routes/routeConfig';
import { Button } from '../components/ui/button';
import { cn } from '../lib';

// Authenticated app shell: sidebar nav (filtered to the current user's role) + topbar.
function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = routeConfig.filter((route) => route.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 shrink-0 border-r border-border p-4">
        <nav className="flex flex-col gap-1">
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
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="text-sm">
            <span className="font-medium">{user?.full_name}</span>
            <span className="ml-2 text-muted-foreground">({role})</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

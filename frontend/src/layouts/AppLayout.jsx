import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { routeConfig } from '../routes/routeConfig';
import { Button } from '../components/ui/button';
import { cn } from '../lib';

function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = routeConfig.filter((route) => route.label && route.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-border/40 bg-white/80 dark:bg-black/80 px-6 py-3 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-6 overflow-x-auto">
          <div className="flex items-center gap-2 mr-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md">
              <span className="text-lg font-bold text-white">E</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">EmServices</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  cn(
                    'relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out',
                    isActive 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.full_name}</span>
            <span className="text-xs text-slate-500 capitalize">{role?.replace(/_/g, ' ')}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full shadow-sm border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;


import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context';
import { routeConfig } from '../routes/routeConfig';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { cn } from '../lib';

// Groups the 9 top-level routeConfig entries into the 4 feature-owner categories
// used by the nav bar. Paths must match routeConfig.jsx's route.path exactly -
// role visibility per item is still resolved from routeConfig, not hardcoded here.
// "Strategic Rankings Dashboard" and "Approvals / Manager Decision" don't have
// dedicated pages yet, so they point at the existing Dashboard / Evaluations
// routes that host those sections until Kai Xuan / Jerrold split them out.
const NAV_GROUPS = [
  {
    label: 'Setup & Submissions',
    items: [
      { label: 'Tenders', path: '/tenders' },
      { label: 'Eligibility Config', path: '/tenders/config' },
    ],
  },
  {
    label: 'Contracts & Rankings',
    items: [
      { label: 'Contracts', path: '/contracts' },
      { label: 'Strategic Rankings Dashboard', path: '/' },
    ],
  },
  {
    label: 'Evaluation & Approvals',
    items: [
      { label: 'Evaluation Criteria', path: '/evaluations/criteria' },
      { label: 'Evaluations', path: '/evaluations' },
      { label: 'Approvals / Manager Decision', path: '/evaluations' },
    ],
  },
  {
    label: 'Reports & Communication',
    items: [
      { label: 'Board Papers / Slides & Reports', path: '/board-papers' },
      { label: 'Clarifications & Alternate Proposals', path: '/clarifications' },
      { label: 'Job Adjustments', path: '/job-adjustment-requests' },
    ],
  },
];

// Authenticated app shell: top nav grouped into role-filtered dropdowns + content.
function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rolesByPath = routeConfig.reduce((acc, route) => {
    if (route.label) acc[route.path] = route.roles;
    return acc;
  }, {});

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => rolesByPath[item.path]?.includes(role)),
  })).filter((group) => group.items.length > 0);

  const isGroupActive = (group) =>
    group.items.some((item) => (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)));

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
            {visibleGroups.map((group) => (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none',
                      isGroupActive(group)
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    )}
                  >
                    {group.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {group.items.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                      <NavLink
                        to={item.path}
                        end
                        className={({ isActive }) =>
                          cn('cursor-pointer', isActive && 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300')
                        }
                      >
                        {item.label}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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

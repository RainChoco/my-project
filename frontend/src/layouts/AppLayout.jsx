import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, FileCheck2, UserPlus, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context';
import { routeConfig } from '../routes/routeConfig';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { cn } from '../lib';

// Town Council operational alerts - static placeholder data until a real
// notifications API exists. `minutesAgo` is relative to load time; `link`
// routes to the relevant tender/contract/report when the notification is clicked.
const NOTIFICATION_TYPES = {
  tender: { icon: FileCheck2, color: 'text-blue-600 dark:text-blue-400' },
  submission: { icon: UserPlus, color: 'text-emerald-600 dark:text-emerald-400' },
  approval: { icon: ClipboardCheck, color: 'text-amber-600 dark:text-amber-400' },
  compliance: { icon: ShieldAlert, color: 'text-red-600 dark:text-red-400' },
};

const TOWN_COUNCIL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'tender',
    message: 'Tender TC-2026-008 closed for evaluation',
    minutesAgo: 10,
    link: '/tenders/8',
  },
  {
    id: 2,
    type: 'submission',
    message: 'New submission received from CPG Facilities Management',
    minutesAgo: 60,
    link: '/tenders/1',
  },
  {
    id: 3,
    type: 'approval',
    message: 'Pending approval: Managing Agent Tender Board Paper #4',
    minutesAgo: 120,
    link: '/board-papers',
  },
  {
    id: 4,
    type: 'compliance',
    message: 'Compliance Alert: bizSAFE Level 3 expiring for Vendor ABC',
    minutesAgo: 1440,
    link: '/tenders/config',
  },
];

function formatRelativeTime(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const hours = Math.round(minutesAgo / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Groups the 9 top-level routeConfig entries into the 4 feature-owner categories
// used by the nav bar. Paths must match routeConfig.jsx's route.path exactly -
// role visibility per item is still resolved from routeConfig, not hardcoded here.
// "Strategic Rankings Dashboard" doesn't have a dedicated page yet, so it points
// at the existing Dashboard route that hosts that section until Kai Xuan splits
// it out.
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
      { label: 'Approvals / Manager Decision', path: '/evaluations/pending-approvals' },
    ],
  },
  {
    label: 'Reports & Communication',
    items: [
      { label: 'Board Papers', path: '/board-papers' },
      { label: 'History', path: '/history' },
      { label: 'Proposal Reports', path: '/proposal-report' },
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

  const [notifications, setNotifications] = useState(
    TOWN_COUNCIL_NOTIFICATIONS.map((n) => ({ ...n, read: false }))
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllAsRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markAsRead = (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

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
            <img src="/em-services-logo.png" alt="EM Services" className="h-8 max-h-8 w-auto" />
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
                        ? 'bg-red-50 text-red-600 hover:text-red-700 border-b-2 border-red-600 dark:bg-red-900/40 dark:text-red-300 dark:border-red-500'
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
                          cn('cursor-pointer', isActive && 'bg-red-50 text-red-600 hover:text-red-700 dark:bg-red-900/40 dark:text-red-300')
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-slate-500">No notifications</div>
              ) : (
                notifications.map((n) => {
                  const { icon: TypeIcon, color } = NOTIFICATION_TYPES[n.type] ?? {};
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      onSelect={() => {
                        markAsRead(n.id);
                        if (n.link) navigate(n.link);
                      }}
                      className={cn(
                        'flex items-start gap-2 whitespace-normal py-2 cursor-pointer',
                        !n.read && 'bg-red-50 dark:bg-red-900/20'
                      )}
                    >
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" aria-hidden="true" />}
                      {TypeIcon && <TypeIcon className={cn('mt-0.5 h-4 w-4 shrink-0', color)} aria-hidden="true" />}
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span className={cn('text-sm leading-snug', !n.read ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-500')}>
                          {n.message}
                        </span>
                        <span className="text-xs text-slate-400">{formatRelativeTime(n.minutesAgo)}</span>
                      </span>
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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

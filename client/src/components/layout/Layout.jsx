import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Car, PlusCircle, Settings, LogOut, ShieldCheck } from 'lucide-react';

const ADMIN_EMAIL = 'ga9service@gmail.com';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/vehicles', icon: Car, label: 'רכבים' },
  { to: '/vehicles/new', icon: PlusCircle, label: 'הוסף רכב' },
  { to: '/settings', icon: Settings, label: 'אזור אישי' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">

      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-4 py-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-lg text-brand-700 dark:text-brand-400 flex items-center gap-2">
          🚗 מעקב טיפולים
        </h1>
        <div className="flex items-center gap-2">
          {user?.email === ADMIN_EMAIL && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                  isActive
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'text-amber-600 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-900/20'
                }`
              }
              title="פאנל מנהל"
            >
              <ShieldCheck size={17} />
              <span className="hidden sm:inline">מנהל</span>
            </NavLink>
          )}
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200 truncate max-w-[100px]">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="התנתקות"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 pb-24 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 safe-area-bottom">
        <div className="flex items-stretch h-16 max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-surface-400 dark:text-surface-500 hover:text-surface-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-brand-50 dark:bg-brand-900/30' : ''}`}>
                    <Icon size={20} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
}

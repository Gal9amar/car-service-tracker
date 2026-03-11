import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/vehicles', icon: Car, label: 'הרכבים שלי' },
  { to: '/vehicles/new', icon: PlusCircle, label: 'הוסף רכב' },
  { to: '/settings', icon: Settings, label: 'הגדרות' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="font-display font-bold text-lg text-brand-700 dark:text-brand-400">
          🚗 מעקב טיפולים
        </h1>
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-300">
          {user?.name?.charAt(0)}
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-surface-800
        border-l border-surface-200 dark:border-surface-700
        transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <h1 className="font-display font-bold text-xl text-brand-700 dark:text-brand-400 flex items-center gap-2">
            <Wrench size={24} />
            מעקב טיפולים
          </h1>
          <p className="text-xs text-surface-500 mt-1">ניהול חכם לרכב שלך</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-300">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.name?.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 w-full text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            התנתקות
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:p-8 p-4 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


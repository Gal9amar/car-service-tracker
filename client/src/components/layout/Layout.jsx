import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Car, Plus, Settings, LogOut, ShieldCheck } from 'lucide-react';

const ADMIN_EMAIL = 'ga9service@gmail.com';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navBase = 'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors';
  const navActive = 'text-brand-600 dark:text-brand-400';
  const navInactive = 'text-surface-400 dark:text-surface-500';

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">

      {/* ── Gradient top header ── */}
      <header
        className="sticky top-0 z-40 px-5 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #003D82 0%, #0066CC 60%, #00B4A0 100%)' }}
      >
        <h1 className="font-display font-bold text-lg text-white flex items-center gap-2 select-none">
          🚗 CarTrack
        </h1>
        <div className="flex items-center gap-2">
          {user?.email === ADMIN_EMAIL && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                  isActive ? 'bg-white/30 text-white' : 'text-white/80 hover:bg-white/20'
                }`
              }
            >
              <ShieldCheck size={17} />
              <span className="hidden sm:inline">מנהל</span>
            </NavLink>
          )}
          <span className="text-sm font-semibold text-white/90 truncate max-w-[90px]">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            title="התנתקות"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 px-4 py-6 pb-32 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── BYD-style glass nav with floating + ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50">
        <div className="max-w-2xl mx-auto px-3 pb-3">
          <div
            className="flex items-end h-[62px] px-2 relative rounded-2xl dark:border dark:border-surface-700/50"
            style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,60,130,0.14)' }}
          >

            {/* Dashboard */}
            <NavLink to="/dashboard" className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-brand-50' : ''}`}>
                    <LayoutDashboard size={21} />
                  </div>
                  <span className="text-[10px] font-semibold">דשבורד</span>
                </>
              )}
            </NavLink>

            {/* Vehicles */}
            <NavLink to="/vehicles" end className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-brand-50' : ''}`}>
                    <Car size={21} />
                  </div>
                  <span className="text-[10px] font-semibold">רכבים</span>
                </>
              )}
            </NavLink>

            {/* Floating + Add Vehicle */}
            <div className="flex-1 flex flex-col items-center justify-end pb-1">
              <NavLink
                to="/vehicles/new"
                className="flex items-center justify-center rounded-2xl active:scale-95 transition-transform"
                style={{
                  width: 52, height: 52,
                  background: 'linear-gradient(135deg, #0066CC 0%, #00B4A0 100%)',
                  boxShadow: '0 6px 20px rgba(0,102,204,0.4)',
                  marginTop: -20,
                }}
              >
                <Plus size={24} className="text-white" strokeWidth={2.5} />
              </NavLink>
              <span className="text-[10px] font-semibold text-surface-400 mt-1">הוסף</span>
            </div>

            {/* Settings */}
            <NavLink to="/settings" className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-brand-50' : ''}`}>
                    <Settings size={21} />
                  </div>
                  <span className="text-[10px] font-semibold">אזור אישי</span>
                </>
              )}
            </NavLink>

          </div>
        </div>
      </nav>

    </div>
  );
}

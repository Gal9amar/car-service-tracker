import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, ChevronLeft, AlertTriangle, Calendar } from 'lucide-react';
import { formatDate, formatNumber, SERVICE_TYPES } from '../utils/constants';

function testStatus(testExpiry) {
  if (!testExpiry) return null;
  const d = new Date(testExpiry);
  const now = new Date();
  if (d < now) return 'expired';
  if (d < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) return 'soon';
  return 'ok';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.get()
      .then(res => setData(res.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-center text-surface-500">שגיאה בטעינת הנתונים</p>;

  const overdueCount = data.overdueReminders?.length || 0;
  const upcomingCount = data.upcomingReminders?.length || 0;

  return (
    <div className="space-y-6 fade-in" dir="rtl">

      {/* Greeting */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-surface-400 text-sm">שלום,</p>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{user?.name} 👋</h1>
        </div>
        <Link to="/vehicles/new"
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-md shadow-brand-500/25 transition-all active:scale-95">
          <Plus size={16} /> רכב חדש
        </Link>
      </div>

      {/* Alert strip */}
      {(overdueCount > 0 || upcomingCount > 0) && (
        <div className="flex gap-3">
          {overdueCount > 0 && (
            <div className="flex-1 flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
              <div>
                <p className="text-xs text-red-400">באיחור</p>
                <p className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">{overdueCount}</p>
              </div>
            </div>
          )}
          {upcomingCount > 0 && (
            <div className="flex-1 flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
              <Calendar size={18} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-xs text-amber-500">תזכורות קרובות</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">{upcomingCount}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overdue reminders */}
      {overdueCount > 0 && (
        <div>
          <h2 className="font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> תזכורות באיחור
          </h2>
          <div className="space-y-2">
            {data.overdueReminders.map(r => (
              <Link key={r.id} to={`/vehicles/${r.vehicle.id}`}
                className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded-2xl px-4 py-3 hover:border-red-300 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{r.title}</p>
                  <p className="text-xs text-surface-400">{r.vehicle.manufacturer} {r.vehicle.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">{formatDate(r.dueDate)}</span>
                  <ChevronLeft size={14} className="text-surface-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Vehicles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-surface-900 dark:text-white">הרכבים שלי</h2>
          <Link to="/vehicles" className="text-xs text-brand-600 font-medium flex items-center gap-0.5">
            הכל <ChevronLeft size={13} />
          </Link>
        </div>

        {data.vehicles.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-4xl mb-3">🚗</p>
            <p className="text-surface-500 text-sm mb-4">עדיין לא הוספת רכבים</p>
            <Link to="/vehicles/new" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus size={15} /> הוסף רכב ראשון
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        )}
      </div>

      {/* Upcoming reminders */}
      {upcomingCount > 0 && (
        <div>
          <h2 className="font-bold text-surface-900 dark:text-white mb-3">תזכורות קרובות</h2>
          <div className="card divide-y divide-surface-100 dark:divide-surface-700/50 overflow-hidden">
            {data.upcomingReminders.slice(0, 4).map(r => (
              <Link key={r.id} to={`/vehicles/${r.vehicle.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔔</span>
                  <div>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{r.title}</p>
                    <p className="text-xs text-surface-400">{r.vehicle.manufacturer} {r.vehicle.model}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-xl whitespace-nowrap">
                  {formatDate(r.dueDate)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}


function IsraeliPlate({ number }) {
  const fmt = (n) => {
    const d = (n || '').replace(/[^0-9]/g, '');
    if (d.length === 7) return `${d.slice(0,2)}-${d.slice(2,5)}-${d.slice(5)}`;
    if (d.length === 8) return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;
    return n;
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'stretch',
      borderRadius: '7px',
      border: '3px solid #1a1a1a',
      overflow: 'hidden',
      height: '46px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      direction: 'ltr',
    }}>
      {/* Blue IL strip */}
      <div style={{
        background: '#003399',
        width: '36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1px',
        padding: '3px 2px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '12px', lineHeight: 1 }}>🇮🇱</span>
        <span style={{ color: 'white', fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1 }}>IL</span>
        <span style={{ color: 'white', fontSize: '6px', lineHeight: 1 }}>ישראל</span>
      </div>
      {/* Yellow plate area */}
      <div style={{
        background: '#F5C400',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: '22px',
          fontWeight: 900,
          color: '#1a1a1a',
          letterSpacing: '2px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}>
          {fmt(number)}
        </span>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle }) {
  const status = testStatus(vehicle.testExpiry);
  const testBadgeStyle = {
    expired: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    soon:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ok:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <Link to={`/vehicles/${vehicle.id}`}
      className="block bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl px-5 py-4 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-sm transition-all group">

      {/* Top: make/model + arrow */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-2xl shrink-0">
            🚗
          </div>
          <div>
            <p className="font-bold text-surface-900 dark:text-white leading-tight">
              {vehicle.manufacturer} {vehicle.model}
            </p>
            {vehicle.nickname && (
              <p className="text-xs text-surface-400">{vehicle.nickname}</p>
            )}
          </div>
        </div>
        <ChevronLeft size={18} className="text-surface-300 group-hover:text-brand-500 transition-colors shrink-0" />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* License plate — Israeli style */}
        <div className="col-span-3 flex justify-center">
          <IsraeliPlate number={vehicle.licensePlate} />
        </div>

        {/* Year */}
        <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-surface-400 mb-0.5">שנת ייצור</p>
          <p className="text-sm font-bold text-surface-800 dark:text-white">{vehicle.year}</p>
        </div>

        {/* Test */}
        <div className={`col-span-2 rounded-xl px-3 py-2.5 ${status ? testBadgeStyle[status] : 'bg-surface-50 dark:bg-surface-700/50'}`}>
          <p className="text-xs opacity-70 mb-0.5">טסט</p>
          <p className="text-sm font-bold leading-tight">
            {vehicle.testExpiry ? formatDate(vehicle.testExpiry) : '—'}
          </p>
        </div>
      </div>

      {/* Last service & next service */}
      {vehicle.lastService && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-surface-100 dark:border-surface-700 pt-3">
          <div className="bg-surface-50 dark:bg-surface-700/40 rounded-xl px-3 py-2">
            <p className="text-xs text-surface-400 mb-0.5">טיפול קודם</p>
            <p className="text-xs font-bold text-surface-700 dark:text-surface-200 truncate">{SERVICE_TYPES[vehicle.lastService.serviceType] || vehicle.lastService.serviceType}</p>
            <div className="flex gap-2 mt-0.5 flex-wrap">
              {vehicle.lastService.mileage && <p className="text-xs text-surface-400">{formatNumber(vehicle.lastService.mileage)} ק״מ</p>}
              <p className="text-xs text-surface-400">{formatDate(vehicle.lastService.date)}</p>
            </div>
          </div>
          {vehicle.lastService.nextServiceMileage ? (
            <div className={`rounded-xl px-3 py-2 border ${vehicle.currentMileage && vehicle.lastService.nextServiceMileage <= vehicle.currentMileage ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-brand-50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-800'}`}>
              <p className="text-xs text-brand-400 mb-0.5">טיפול הבא</p>
              <p className="text-sm font-black text-brand-600 dark:text-brand-400">{formatNumber(vehicle.lastService.nextServiceMileage)} ק״מ</p>
              {vehicle.currentMileage && vehicle.lastService.nextServiceMileage > vehicle.currentMileage && (
                <p className="text-xs text-surface-400">נותרו {formatNumber(vehicle.lastService.nextServiceMileage - vehicle.currentMileage)} ק״מ</p>
              )}
              {vehicle.currentMileage && vehicle.lastService.nextServiceMileage <= vehicle.currentMileage && (
                <p className="text-xs text-red-500 font-medium">⚠️ הגיע זמן טיפול!</p>
              )}
            </div>
          ) : (
            <div className="bg-surface-50 dark:bg-surface-700/40 rounded-xl px-3 py-2">
              <p className="text-xs text-surface-400 mb-0.5">טיפול הבא</p>
              <p className="text-xs text-surface-300">לא הוגדר</p>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

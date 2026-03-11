import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, ChevronLeft, AlertTriangle, Gauge, Calendar, Wrench } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/constants';

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

  const totalThisMonth = data.monthlySpend?.total || 0;
  const totalServices = data.monthlySpend?.services || 0;
  const totalExpenses = data.monthlySpend?.expenses || 0;
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

      {/* Big numbers — monthly summary */}
      <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/20">
        <p className="text-sm text-white/60 mb-1">סה״כ הוצאות החודש</p>
        <p className="text-5xl font-black tracking-tight mb-5">
          {formatCurrency(totalThisMonth)}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl px-4 py-3">
            <p className="text-xs text-white/60 mb-1">🔧 טיפולים</p>
            <p className="text-xl font-bold">{formatCurrency(totalServices)}</p>
          </div>
          <div className="bg-white/10 rounded-2xl px-4 py-3">
            <p className="text-xs text-white/60 mb-1">💳 הוצאות</p>
            <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
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
                <p className="text-xs text-amber-500">קרובות</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">{upcomingCount}</p>
              </div>
            </div>
          )}
          <div className="flex-1 flex items-center gap-2.5 bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-3">
            <Wrench size={18} className="text-surface-400 shrink-0" />
            <div>
              <p className="text-xs text-surface-400">רכבים</p>
              <p className="text-2xl font-black text-surface-700 dark:text-surface-200 leading-none">{data.vehicleCount}</p>
            </div>
          </div>
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

      {/* Vehicles list */}
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
            {data.vehicles.map(v => <VehicleRow key={v.id} vehicle={v} />)}
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

function VehicleRow({ vehicle }) {
  const testExpiry = vehicle.testExpiry ? new Date(vehicle.testExpiry) : null;
  const testBadge = !testExpiry ? null
    : testExpiry < new Date()
      ? { text: `טסט פג — ${formatDate(vehicle.testExpiry)}`, cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' }
      : testExpiry < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        ? { text: `טסט: ${formatDate(vehicle.testExpiry)}`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
        : { text: `טסט: ${formatDate(vehicle.testExpiry)}`, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };

  return (
    <Link to={`/vehicles/${vehicle.id}`}
      className="flex items-center gap-4 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl px-4 py-4 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-sm transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-2xl shrink-0">
        🚗
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-surface-900 dark:text-white truncate">
          {vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-surface-400 font-mono" dir="ltr">{vehicle.licensePlate}</span>
          {vehicle.currentMileage && (
            <span className="flex items-center gap-1 text-xs text-surface-400">
              <Gauge size={11} />{vehicle.currentMileage.toLocaleString('he-IL')} ק״מ
            </span>
          )}
          <span className="text-xs text-surface-400">{vehicle.serviceCount} טיפולים</span>
        </div>
        {testBadge && (
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-lg mt-1.5 ${testBadge.cls}`}>
            {testBadge.text}
          </span>
        )}
      </div>
      <ChevronLeft size={18} className="text-surface-300 group-hover:text-brand-500 transition-colors shrink-0" />
    </Link>
  );
}

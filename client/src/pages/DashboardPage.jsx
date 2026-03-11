import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Car, AlertTriangle, Bell, TrendingUp, Plus, ChevronLeft, Calendar, Gauge } from 'lucide-react';
import { formatCurrency, formatDate, REMINDER_TYPES } from '../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.get().then(res => setData(res.dashboard)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-center text-surface-500">שגיאה בטעינת הנתונים</p>;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">שלום, {user?.name} 👋</h1>
          <p className="text-surface-500 text-sm mt-1">הנה סיכום הרכבים שלך</p>
        </div>
        <Link to="/vehicles/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          הוסף רכב
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Car} label="רכבים" value={data.vehicleCount} color="brand" />
        <StatCard icon={AlertTriangle} label="תזכורות באיחור" value={data.overdueReminders.length} color="red" />
        <StatCard icon={Bell} label="תזכורות קרובות" value={data.upcomingReminders.length} color="amber" />
        <StatCard icon={TrendingUp} label="הוצאות החודש" value={formatCurrency(data.monthlySpend.total)} color="emerald" />
      </div>

      {/* Overdue reminders */}
      {data.overdueReminders.length > 0 && (
        <div className="card p-5 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
            <AlertTriangle size={20} />
            תזכורות באיחור
          </h3>
          <div className="space-y-2">
            {data.overdueReminders.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white dark:bg-surface-800 rounded-xl p-3">
                <div>
                  <span className="font-medium">{r.title}</span>
                  <span className="text-sm text-surface-500 mr-2">
                    ({r.vehicle.manufacturer} {r.vehicle.model})
                  </span>
                </div>
                <span className="text-sm text-red-500">{formatDate(r.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicles list */}
      <div>
        <h2 className="font-display font-bold text-lg mb-4">הרכבים שלי</h2>
        {data.vehicles.length === 0 ? (
          <div className="card p-12 text-center">
            <Car className="mx-auto text-surface-300 mb-4" size={48} />
            <p className="text-surface-500 mb-4">עדיין לא הוספת רכבים</p>
            <Link to="/vehicles/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} />
              הוסף רכב ראשון
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.vehicles.map(vehicle => (
              <Link key={vehicle.id} to={`/vehicles/${vehicle.id}`} className="card p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-2xl">
                      🚗
                    </div>
                    <div>
                      <h3 className="font-bold">{vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}</h3>
                      <p className="text-sm text-surface-500">{vehicle.licensePlate} • {vehicle.year}</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-surface-400 group-hover:text-brand-500 transition-colors" />
                </div>

                <div className="flex gap-4 mt-4 text-sm">
                  {vehicle.currentMileage && (
                    <span className="flex items-center gap-1 text-surface-500">
                      <Gauge size={14} />
                      {vehicle.currentMileage.toLocaleString()} ק״מ
                    </span>
                  )}
                  {vehicle.testExpiry && (
                    <span className={`flex items-center gap-1 ${
                      new Date(vehicle.testExpiry) < new Date() ? 'text-red-500' :
                      new Date(vehicle.testExpiry) < new Date(Date.now() + 60*24*60*60*1000) ? 'text-amber-500' :
                      'text-emerald-500'
                    }`}>
                      <Calendar size={14} />
                      טסט: {formatDate(vehicle.testExpiry)}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 mt-3">
                  <span className="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-lg">
                    {vehicle.serviceCount} טיפולים
                  </span>
                  <span className="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-lg">
                    {vehicle.expenseCount} הוצאות
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming reminders */}
      {data.upcomingReminders.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-lg mb-4">תזכורות קרובות</h2>
          <div className="card divide-y divide-surface-100 dark:divide-surface-700">
            {data.upcomingReminders.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{REMINDER_TYPES[r.reminderType] === 'טסט' ? '✅' : '🔔'}</span>
                  <div>
                    <span className="font-medium">{r.title}</span>
                    <p className="text-sm text-surface-500">{r.vehicle.manufacturer} {r.vehicle.model}</p>
                  </div>
                </div>
                <span className="text-sm text-surface-500">{formatDate(r.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
    </div>
  );
}

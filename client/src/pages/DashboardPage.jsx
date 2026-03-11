import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, ChevronLeft, ArrowDownLeft, AlertTriangle, Bell, Car, Wrench, ShoppingBag, Fuel, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate, REMINDER_TYPES } from '../utils/constants';

const EXPENSE_ICONS = {
  FUEL: '⛽', PARKING: '🅿️', FINE: '🚔', INSURANCE: '🛡️',
  LICENSE: '📋', TOLL: '🛣️', WASH: '🫧', ACCESSORIES: '🔧', OTHER: '💳',
};
const SERVICE_ICONS = {
  OIL: '🛢️', BRAKES: '🔴', TIRES: '🔄', BATTERY: '🔋',
  TEST: '✅', AC: '❄️', TIMING_BELT: '⚙️', FILTERS: '🌬️',
  SUSPENSION: '🔩', ELECTRICAL: '⚡', BODY_WORK: '🔨', GENERAL: '🔧', OTHER: '🛠️',
};
const SERVICE_LABELS = {
  OIL: 'החלפת שמן', BRAKES: 'בלמים', TIRES: 'צמיגים', BATTERY: 'מצבר',
  TEST: 'טסט שנתי', AC: 'מיזוג אוויר', TIMING_BELT: 'רצועת טיימינג',
  FILTERS: 'פילטרים', SUSPENSION: 'מתלים', ELECTRICAL: 'חשמל',
  BODY_WORK: 'פחחות', GENERAL: 'כללי', OTHER: 'אחר',
};
const EXPENSE_LABELS = {
  FUEL: 'דלק', PARKING: 'חניה', FINE: 'דוח', INSURANCE: 'ביטוח',
  LICENSE: 'רישיון', TOLL: 'אגרה', WASH: 'שטיפה', ACCESSORIES: 'אביזרים', OTHER: 'אחר',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(0);

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

  const activeVehicle = data.vehicles[activeCard];
  const totalThisMonth = data.monthlySpend?.total || 0;
  const totalServices = data.monthlySpend?.services || 0;
  const totalExpenses = data.monthlySpend?.expenses || 0;

  // Merge recent transactions
  const recentTransactions = [
    ...(activeVehicle?.lastService ? [{
      id: 'svc-last',
      type: 'service',
      label: SERVICE_LABELS[activeVehicle.lastService.serviceType] || 'טיפול',
      icon: SERVICE_ICONS[activeVehicle.lastService.serviceType] || '🔧',
      amount: -Number(activeVehicle.lastService.cost),
      date: activeVehicle.lastService.date,
    }] : []),
    ...(data.overdueReminders || []).slice(0, 3).map(r => ({
      id: r.id,
      type: 'reminder',
      label: r.title,
      icon: '⚠️',
      amount: null,
      date: r.dueDate,
      overdue: true,
    })),
    ...(data.upcomingReminders || []).slice(0, 3).map(r => ({
      id: r.id,
      type: 'upcoming',
      label: r.title,
      icon: '🔔',
      amount: null,
      date: r.dueDate,
    })),
  ].slice(0, 6);

  return (
    <div className="space-y-5 fade-in pb-2" dir="rtl">

      {/* Greeting */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-surface-400 text-sm">שלום,</p>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">{user?.name} 👋</h1>
        </div>
        <Link to="/vehicles/new" className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-2xl shadow-md shadow-brand-500/30 transition-all active:scale-95">
          <Plus size={16} />
          רכב חדש
        </Link>
      </div>

      {/* Vehicle Cards — horizontal scroll */}
      {data.vehicles.length > 0 ? (
        <div className="space-y-3">
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
            {data.vehicles.map((v, i) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                active={i === activeCard}
                onClick={() => setActiveCard(i)}
                index={i}
              />
            ))}
          </div>
          {/* Dots indicator */}
          {data.vehicles.length > 1 && (
            <div className="flex justify-center gap-1.5">
              {data.vehicles.map((_, i) => (
                <button key={i} onClick={() => setActiveCard(i)}
                  className={`rounded-full transition-all ${i === activeCard ? 'w-5 h-2 bg-brand-500' : 'w-2 h-2 bg-surface-300 dark:bg-surface-600'}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <Car className="mx-auto text-surface-300 mb-3" size={40} />
          <p className="text-surface-500 mb-4 text-sm">עדיין לא הוספת רכבים</p>
          <Link to="/vehicles/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus size={16} />הוסף רכב ראשון
          </Link>
        </div>
      )}

      {/* Monthly spend summary */}
      <div className="grid grid-cols-3 gap-3">
        <SpendTile label="החודש" value={formatCurrency(totalThisMonth)} color="brand" icon={<TrendingDown size={14}/>} />
        <SpendTile label="טיפולים" value={formatCurrency(totalServices)} color="violet" icon={<Wrench size={14}/>} />
        <SpendTile label="הוצאות" value={formatCurrency(totalExpenses)} color="sky" icon={<ShoppingBag size={14}/>} />
      </div>

      {/* Alerts */}
      {data.overdueReminders.length > 0 && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-sm font-bold text-red-700 dark:text-red-400">
              {data.overdueReminders.length} תזכורות באיחור
            </span>
          </div>
          <div className="space-y-2">
            {data.overdueReminders.slice(0, 3).map(r => (
              <Link key={r.id} to={`/vehicles/${r.vehicle.id}`}
                className="flex items-center justify-between bg-white dark:bg-surface-800 rounded-xl px-3 py-2 text-sm">
                <span className="font-medium text-surface-800 dark:text-surface-200">{r.title}</span>
                <span className="text-xs text-red-500">{formatDate(r.dueDate)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-surface-900 dark:text-white">פעילות אחרונה</h2>
            {activeVehicle && (
              <Link to={`/vehicles/${activeVehicle.id}`} className="text-xs text-brand-600 font-medium flex items-center gap-1">
                הכל <ChevronLeft size={14}/>
              </Link>
            )}
          </div>
          <div className="card divide-y divide-surface-100 dark:divide-surface-700/50 overflow-hidden">
            {recentTransactions.map(t => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming reminders */}
      {data.upcomingReminders.length > 0 && (
        <div>
          <h2 className="font-bold text-surface-900 dark:text-white mb-3">תזכורות קרובות</h2>
          <div className="space-y-2">
            {data.upcomingReminders.slice(0, 4).map(r => (
              <Link key={r.id} to={`/vehicles/${r.vehicle.id}`}
                className="flex items-center gap-3 bg-white dark:bg-surface-800 rounded-2xl px-4 py-3 border border-surface-100 dark:border-surface-700 hover:border-brand-200 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-lg">
                  🔔
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{r.title}</p>
                  <p className="text-xs text-surface-400">{r.vehicle.manufacturer} {r.vehicle.model}</p>
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg whitespace-nowrap">
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

function VehicleCard({ vehicle, active, onClick, index }) {
  const gradients = [
    'from-brand-600 via-brand-700 to-indigo-800',
    'from-slate-700 via-slate-800 to-slate-900',
    'from-emerald-600 via-teal-700 to-cyan-800',
    'from-rose-500 via-rose-600 to-pink-700',
  ];
  const gradient = gradients[index % gradients.length];

  const testExpiry = vehicle.testExpiry ? new Date(vehicle.testExpiry) : null;
  const testStatus = !testExpiry ? null
    : testExpiry < new Date() ? 'expired'
    : testExpiry < new Date(Date.now() + 60*24*60*60*1000) ? 'soon'
    : 'ok';

  return (
    <button onClick={onClick}
      className={`snap-start shrink-0 w-[88vw] max-w-sm bg-gradient-to-br ${gradient} rounded-3xl p-5 text-white text-right transition-all duration-200 ${active ? 'ring-2 ring-brand-400 ring-offset-2 shadow-xl shadow-brand-500/30' : 'opacity-80'}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-5">
        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-xl">
          🚗
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60 mb-0.5">לוחית</p>
          <p className="text-base font-bold tracking-widest font-mono" dir="ltr">{vehicle.licensePlate}</p>
        </div>
      </div>

      {/* Vehicle name */}
      <div className="mb-4">
        <p className="text-lg font-bold leading-tight">
          {vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}
        </p>
        <p className="text-sm text-white/60">{vehicle.year}</p>
      </div>

      {/* Bottom row */}
      <div className="flex items-end justify-between">
        <div className="flex gap-3">
          {vehicle.currentMileage && (
            <div>
              <p className="text-xs text-white/50">ק״מ</p>
              <p className="text-sm font-semibold">{vehicle.currentMileage.toLocaleString('he-IL')}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-white/50">טיפולים</p>
            <p className="text-sm font-semibold">{vehicle.serviceCount}</p>
          </div>
        </div>
        {testStatus && (
          <div className={`text-xs font-medium px-2.5 py-1 rounded-xl ${
            testStatus === 'expired' ? 'bg-red-500/30 text-red-200' :
            testStatus === 'soon' ? 'bg-amber-400/30 text-amber-200' :
            'bg-white/15 text-white/80'
          }`}>
            טסט: {formatDate(vehicle.testExpiry)}
          </div>
        )}
      </div>
    </button>
  );
}

function SpendTile({ label, value, color, icon }) {
  const colors = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300',
  };
  return (
    <div className={`rounded-2xl p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1 mb-1.5 opacity-70">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold leading-tight">{value}</p>
    </div>
  );
}

function TransactionRow({ transaction }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-base shrink-0">
        {transaction.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{transaction.label}</p>
        <p className="text-xs text-surface-400">{formatDate(transaction.date)}</p>
      </div>
      {transaction.amount !== null ? (
        <span className="text-sm font-bold text-red-500 shrink-0">
          {"-"}{formatCurrency(Math.abs(transaction.amount))}
        </span>
      ) : transaction.overdue ? (
        <span className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg shrink-0">באיחור</span>
      ) : (
        <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg shrink-0">קרוב</span>
      )}
    </div>
  );
}

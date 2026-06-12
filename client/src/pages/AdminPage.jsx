import { useEffect, useState } from 'react';
import { Users, Car, Wrench, CreditCard, ChevronDown, ChevronUp, Calendar, Gauge, Trash2 } from 'lucide-react';

const ADMIN_API = '/api/admin/users';

const SERVICE_TYPE_LABELS = {
  PERIODIC: 'טיפול תקופתי', OIL: 'החלפת שמן', BRAKES: 'בלמים',
  TIRES: 'צמיגים', BATTERY: 'מצבר', AC: 'מיזוג אוויר',
  TIMING_BELT: 'רצועת טיימינג', FILTERS: 'פילטרים', SUSPENSION: 'מתלים',
  ELECTRICAL: 'חשמל', BODY_WORK: 'פחחות', GENERAL: 'כללי', OTHER: 'אחר',
};

const EXPENSE_LABELS = {
  FUEL: 'דלק', PARKING: 'חניה', FINE: 'קנס', INSURANCE: 'ביטוח',
  LICENSE: 'רישיון', TOLL: 'אגרה', WASH: 'שטיפה',
  ACCESSORIES: 'אביזרים', OTHER: 'אחר',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('he-IL');
}

function VehicleCard({ vehicle }) {
  const [open, setOpen] = useState(false);
  const testExpiry = vehicle.testExpiry ? new Date(vehicle.testExpiry) : null;
  const testSoon = testExpiry && (testExpiry - Date.now()) < 60 * 24 * 60 * 60 * 1000;
  const testPast = testExpiry && testExpiry < Date.now();

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-750 transition-colors text-right"
      >
        <div className="flex items-center gap-3">
          <Car size={18} className="text-brand-500 shrink-0" />
          <div>
            <p className="font-semibold text-surface-800 dark:text-surface-100 text-sm">
              {vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}
              <span className="mr-2 text-surface-400 font-normal">{vehicle.licensePlate}</span>
            </p>
            <p className="text-xs text-surface-500">
              {vehicle.manufacturer} {vehicle.model} {vehicle.year}
              {vehicle.fuelType && ` · ${vehicle.fuelType}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-2 text-xs">
            <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-full px-2 py-0.5">
              {vehicle._count.services} טיפולים
            </span>
            <span className="bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 rounded-full px-2 py-0.5">
              {vehicle._count.expenses} הוצאות
            </span>
          </div>
          {open ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 space-y-4 bg-white dark:bg-surface-900">
          {/* פרטי רכב */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {vehicle.currentMileage && (
              <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                <Gauge size={13} />
                <span>{vehicle.currentMileage.toLocaleString()} ק"מ</span>
              </div>
            )}
            {testExpiry && (
              <div className={`flex items-center gap-1.5 ${testPast ? 'text-red-600' : testSoon ? 'text-amber-600' : 'text-surface-600 dark:text-surface-400'}`}>
                <Calendar size={13} />
                <span>טסט: {fmt(vehicle.testExpiry)}</span>
              </div>
            )}
          </div>

          {/* טיפולים אחרונים */}
          {vehicle.services.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Wrench size={12} /> טיפולים אחרונים
              </p>
              <div className="space-y-1">
                {vehicle.services.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs py-1 border-b border-surface-100 dark:border-surface-800 last:border-0">
                    <div>
                      <span className="font-medium text-surface-700 dark:text-surface-300">
                        {SERVICE_TYPE_LABELS[s.serviceType] || s.serviceType}
                      </span>
                      {s.description && <span className="text-surface-400 mr-1">– {s.description}</span>}
                    </div>
                    <div className="flex gap-2 text-surface-500 shrink-0 mr-2">
                      <span>{fmt(s.date)}</span>
                      {s.cost && <span className="text-green-600 dark:text-green-400">₪{Number(s.cost).toLocaleString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* הוצאות אחרונות */}
          {vehicle.expenses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <CreditCard size={12} /> הוצאות אחרונות
              </p>
              <div className="space-y-1">
                {vehicle.expenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center text-xs py-1 border-b border-surface-100 dark:border-surface-800 last:border-0">
                    <div>
                      <span className="font-medium text-surface-700 dark:text-surface-300">
                        {EXPENSE_LABELS[e.category] || e.category}
                      </span>
                      {e.description && <span className="text-surface-400 mr-1">– {e.description}</span>}
                    </div>
                    <div className="flex gap-2 text-surface-500 shrink-0 mr-2">
                      <span>{fmt(e.date)}</span>
                      <span className="text-green-600 dark:text-green-400">₪{Number(e.amount).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserCard({ user, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');
      onDelete(user.id);
    } catch (err) {
      alert(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="card p-0 overflow-hidden">
      <button
        onClick={() => { setOpen(o => !o); setConfirmDelete(false); }}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-right"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shrink-0">
            {user.name?.[0] || user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-surface-800 dark:text-surface-100">{user.name || '—'}</p>
            <p className="text-xs text-surface-500">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-left">
            <p className="text-xs text-surface-400">נרשם {fmt(user.createdAt)}</p>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">{user._count.vehicles} רכבים</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`p-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 ${
              confirmDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
            } disabled:opacity-50`}
            title="מחק משתמש"
          >
            {deleting
              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Trash2 size={14} />{confirmDelete && <span>אישור</span>}</>
            }
          </button>
          {open ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-3 border-t border-surface-100 dark:border-surface-700 pt-3">
          {user.vehicles.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-2">אין רכבים</p>
          ) : (
            user.vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(ADMIN_API, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setUsers(d.users);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const deleteUser = (id) => setUsers(prev => prev.filter(u => u.id !== id));
  const totalVehicles = users.reduce((s, u) => s + u._count.vehicles, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
          פאנל מנהל
        </h1>
        <p className="text-sm text-surface-500 mt-1">סקירת כל המשתמשים והנתונים שלהם</p>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
            <Users size={20} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{users.length}</p>
            <p className="text-xs text-surface-500">משתמשים</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Car size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{totalVehicles}</p>
            <p className="text-xs text-surface-500">רכבים</p>
          </div>
        </div>
      </div>

      {/* רשימת משתמשים */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <p className="text-center text-surface-400 py-10">אין משתמשים</p>
        ) : (
          users.map(u => <UserCard key={u.id} user={u} onDelete={deleteUser} />)
        )}
      </div>
    </div>
  );
}

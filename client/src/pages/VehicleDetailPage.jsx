import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vehicles as vehiclesApi, reports } from '../services/api';
import { ArrowRight, Wrench, Receipt, Bell, FileText, Plus, Trash2, Calendar, Gauge, Fuel, Palette } from 'lucide-react';
import { SERVICE_TYPES, SERVICE_TYPE_ICONS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_ICONS, REMINDER_TYPES, formatCurrency, formatDate, formatNumber } from '../utils/constants';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [tab, setTab] = useState('services');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehiclesApi.get(id).then(res => setVehicle(res.vehicle)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!vehicle) return <p className="text-center text-surface-500">רכב לא נמצא</p>;

  const tabs = [
    { id: 'services', label: 'טיפולים', icon: Wrench, count: vehicle.services.length },
    { id: 'expenses', label: 'הוצאות', icon: Receipt, count: vehicle.expenses.length },
    { id: 'reminders', label: 'תזכורות', icon: Bell, count: vehicle.reminders.length },
    { id: 'details', label: 'פרטים', icon: FileText },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Back */}
      <Link to="/vehicles" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
        <ArrowRight size={16} />
        חזרה לרכבים
      </Link>

      {/* Vehicle header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-4xl flex-shrink-0">
            {vehicle.imageUrl ? <img src={vehicle.imageUrl} alt="" className="w-full h-full rounded-2xl object-cover" /> : '🚗'}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">
              {vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}
            </h1>
            <p className="text-surface-500" dir="ltr">{vehicle.licensePlate} • {vehicle.year}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm">
              {vehicle.currentMileage && <span className="flex items-center gap-1 text-surface-500"><Gauge size={14} />{formatNumber(vehicle.currentMileage)} ק״מ</span>}
              {vehicle.fuelType && <span className="flex items-center gap-1 text-surface-500"><Fuel size={14} />{vehicle.fuelType}</span>}
              {vehicle.color && <span className="flex items-center gap-1 text-surface-500"><Palette size={14} />{vehicle.color}</span>}
              {vehicle.testExpiry && (
                <span className={`flex items-center gap-1 font-medium ${
                  new Date(vehicle.testExpiry) < new Date() ? 'text-red-500' : 'text-emerald-500'
                }`}>
                  <Calendar size={14} />טסט: {formatDate(vehicle.testExpiry)}
                </span>
              )}
            </div>
          </div>
          <a href={reports.vehiclePdfUrl(vehicle.id)} target="_blank" rel="noopener" className="btn-secondary flex items-center gap-2 self-start">
            <FileText size={18} />
            הורד דוח PDF
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white dark:bg-surface-700 shadow-sm text-brand-700 dark:text-brand-400' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <t.icon size={16} />
            {t.label}
            {t.count !== undefined && <span className="text-xs bg-surface-200 dark:bg-surface-600 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'services' && <ServicesTab services={vehicle.services} />}
      {tab === 'expenses' && <ExpensesTab expenses={vehicle.expenses} />}
      {tab === 'reminders' && <RemindersTab reminders={vehicle.reminders} />}
      {tab === 'details' && <DetailsTab vehicle={vehicle} />}
    </div>
  );
}

function ServicesTab({ services }) {
  if (!services.length) return <EmptyState text="אין טיפולים רשומים" icon="🔧" />;
  return (
    <div className="space-y-3">
      {services.map(s => (
        <div key={s.id} className="card p-4 flex items-center gap-4">
          <span className="text-2xl">{SERVICE_TYPE_ICONS[s.serviceType] || '🔧'}</span>
          <div className="flex-1">
            <h4 className="font-medium">{SERVICE_TYPES[s.serviceType]}</h4>
            <p className="text-sm text-surface-500">{formatDate(s.date)} {s.garage?.name ? `• ${s.garage.name}` : ''}</p>
            {s.description && <p className="text-sm text-surface-400 mt-1">{s.description}</p>}
          </div>
          <div className="text-left">
            <p className="font-bold">{formatCurrency(Number(s.cost))}</p>
            {s.mileage && <p className="text-xs text-surface-500">{formatNumber(s.mileage)} ק״מ</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpensesTab({ expenses }) {
  if (!expenses.length) return <EmptyState text="אין הוצאות רשומות" icon="💰" />;
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  return (
    <div className="space-y-3">
      <div className="card p-4 bg-brand-50 dark:bg-brand-900/20 text-center">
        <p className="text-sm text-surface-500">סה״כ הוצאות</p>
        <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">{formatCurrency(total)}</p>
      </div>
      {expenses.map(e => (
        <div key={e.id} className="card p-4 flex items-center gap-4">
          <span className="text-2xl">{EXPENSE_CATEGORY_ICONS[e.category] || '📦'}</span>
          <div className="flex-1">
            <h4 className="font-medium">{EXPENSE_CATEGORIES[e.category]}</h4>
            <p className="text-sm text-surface-500">{formatDate(e.date)}</p>
            {e.description && <p className="text-sm text-surface-400">{e.description}</p>}
          </div>
          <p className="font-bold">{formatCurrency(Number(e.amount))}</p>
        </div>
      ))}
    </div>
  );
}

function RemindersTab({ reminders }) {
  if (!reminders.length) return <EmptyState text="אין תזכורות" icon="🔔" />;
  return (
    <div className="space-y-3">
      {reminders.map(r => (
        <div key={r.id} className={`card p-4 flex items-center gap-4 ${
          r.dueDate && new Date(r.dueDate) < new Date() ? 'border-red-200 dark:border-red-800' : ''
        }`}>
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <h4 className="font-medium">{r.title}</h4>
            <p className="text-sm text-surface-500">{REMINDER_TYPES[r.reminderType]}</p>
          </div>
          <div className="text-left">
            {r.dueDate && (
              <p className={`text-sm font-medium ${new Date(r.dueDate) < new Date() ? 'text-red-500' : 'text-surface-600'}`}>
                {formatDate(r.dueDate)}
              </p>
            )}
            {r.dueMileage && <p className="text-xs text-surface-500">{formatNumber(r.dueMileage)} ק״מ</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailsTab({ vehicle }) {
  const fields = [
    ['יצרן', vehicle.manufacturer], ['דגם', vehicle.model], ['שנה', vehicle.year],
    ['צבע', vehicle.color], ['דלק', vehicle.fuelType], ['מנוע', vehicle.engineModel],
    ['גימור', vehicle.trim], ['מספר שלדה', vehicle.vin], ['צמיג קדמי', vehicle.frontTire],
    ['צמיג אחורי', vehicle.rearTire], ['עלייה לכביש', vehicle.firstRegistered], ['בעלות', vehicle.ownership],
  ];
  return (
    <div className="card p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-surface-500 mb-0.5">{label}</p>
            <p className="font-medium">{value || '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text, icon }) {
  return (
    <div className="card p-12 text-center">
      <span className="text-4xl block mb-3">{icon}</span>
      <p className="text-surface-500">{text}</p>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vehicles as vehiclesApi, services as servicesApi, expenses as expensesApi, reminders as remindersApi, reports } from '../services/api';
import { ArrowRight, Wrench, Receipt, Bell, FileText, Plus, X, Calendar, Gauge, Fuel, Palette, Loader2, Pencil, Trash2 } from 'lucide-react';
import { SERVICE_TYPES, SERVICE_TYPE_ICONS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_ICONS, REMINDER_TYPES, formatCurrency, formatDate, formatNumber } from '../utils/constants';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [tab, setTab] = useState('services');
  const [loading, setLoading] = useState(true);

  const fetchVehicle = useCallback(() => {
    vehiclesApi.get(id).then(res => setVehicle(res.vehicle)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchVehicle(); }, [fetchVehicle]);

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
      <Link to="/vehicles" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
        <ArrowRight size={16} />חזרה לרכבים
      </Link>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center text-4xl flex-shrink-0">
            {vehicle.imageUrl ? <img src={vehicle.imageUrl} alt="" className="w-full h-full rounded-2xl object-cover" /> : '🚗'}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}</h1>
            <p className="text-surface-500" dir="ltr">{vehicle.licensePlate} • {vehicle.year}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm">
              {vehicle.currentMileage && <span className="flex items-center gap-1 text-surface-500"><Gauge size={14} />{formatNumber(vehicle.currentMileage)} ק״מ</span>}
              {vehicle.fuelType && <span className="flex items-center gap-1 text-surface-500"><Fuel size={14} />{vehicle.fuelType}</span>}
              {vehicle.color && <span className="flex items-center gap-1 text-surface-500"><Palette size={14} />{vehicle.color}</span>}
              {vehicle.testExpiry && (
                <span className={`flex items-center gap-1 font-medium ${new Date(vehicle.testExpiry) < new Date() ? 'text-red-500' : 'text-emerald-500'}`}>
                  <Calendar size={14} />טסט: {formatDate(vehicle.testExpiry)}
                </span>
              )}
            </div>
          </div>
          <a href={reports.vehiclePdfUrl(vehicle.id)} target="_blank" rel="noopener" className="btn-secondary flex items-center gap-2 self-start">
            <FileText size={18} />הורד דוח PDF
          </a>
        </div>
      </div>

      <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-brand-700' : 'text-surface-500 hover:text-surface-700'}`}>
            <t.icon size={16} />{t.label}
            {t.count !== undefined && <span className="text-xs bg-surface-200 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'services' && <ServicesTab vehicleId={vehicle.id} services={vehicle.services} onRefresh={fetchVehicle} />}
      {tab === 'expenses' && <ExpensesTab vehicleId={vehicle.id} expenses={vehicle.expenses} onRefresh={fetchVehicle} />}
      {tab === 'reminders' && <RemindersTab vehicleId={vehicle.id} reminders={vehicle.reminders} onRefresh={fetchVehicle} />}
      {tab === 'details' && <DetailsTab vehicle={vehicle} />}
    </div>
  );
}

// ─── Services Tab ────────────────────────────────────────────────────────────

function ServicesTab({ vehicleId, services, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const emptyForm = { serviceType: 'OIL', date: new Date().toISOString().split('T')[0], cost: '', mileage: '', description: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({
      serviceType: s.serviceType,
      date: s.date ? s.date.split('T')[0] : '',
      cost: s.cost ?? '',
      mileage: s.mileage ?? '',
      description: s.description ?? '',
    });
    setEditingId(s.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        vehicleId,
        serviceType: form.serviceType,
        date: form.date,
        cost: Number(form.cost),
        mileage: form.mileage ? Number(form.mileage) : undefined,
        description: form.description || undefined,
      };
      if (editingId) {
        await servicesApi.update(editingId, payload);
      } else {
        await servicesApi.create(payload);
      }
      closeForm();
      onRefresh();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק טיפול זה?')) return;
    setDeletingId(id);
    try {
      await servicesApi.delete(id);
      onRefresh();
    } catch (err) { alert(err.message); } finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">טיפולים ({services.length})</h3>
        <button onClick={showForm ? closeForm : openAdd} className={showForm ? 'btn-secondary flex items-center gap-2' : 'btn-primary flex items-center gap-2'}>
          {showForm ? <><X size={16} />ביטול</> : <><Plus size={16} />הוסף טיפול</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 slide-up">
          <h4 className="font-semibold">{editingId ? 'עריכת טיפול' : 'טיפול חדש'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">סוג טיפול</label>
              <select value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})} className="input">
                {Object.entries(SERVICE_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div><label className="label">תאריך</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input" required /></div>
            <div><label className="label">עלות (₪)</label><input type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="input" placeholder="0" required dir="ltr" /></div>
            <div><label className="label">קילומטראז׳</label><input type="number" value={form.mileage} onChange={e => setForm({...form, mileage: e.target.value})} className="input" placeholder="120000" dir="ltr" /></div>
          </div>
          <div><label className="label">הערות</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-[60px]" placeholder="פרטים נוספים..." /></div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}{editingId ? 'עדכן טיפול' : 'שמור טיפול'}
          </button>
        </form>
      )}

      {services.length === 0 && !showForm ? (
        <EmptyState text="אין טיפולים רשומים" icon="🔧" action="הוסף טיפול ראשון" onAction={openAdd} />
      ) : services.map(s => (
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
          <div className="flex gap-1">
            <button onClick={() => openEdit(s)} className="p-2 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="ערוך">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="מחק">
              {deletingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Expenses Tab ────────────────────────────────────────────────────────────

function ExpensesTab({ vehicleId, expenses, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const emptyForm = { category: 'FUEL', date: new Date().toISOString().split('T')[0], amount: '', description: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (e) => {
    setForm({ category: e.category, date: e.date ? e.date.split('T')[0] : '', amount: e.amount ?? '', description: e.description ?? '' });
    setEditingId(e.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { vehicleId, category: form.category, date: form.date, amount: Number(form.amount), description: form.description || undefined };
      if (editingId) {
        await expensesApi.update(editingId, payload);
      } else {
        await expensesApi.create(payload);
      }
      closeForm();
      onRefresh();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק הוצאה זו?')) return;
    setDeletingId(id);
    try {
      await expensesApi.delete(id);
      onRefresh();
    } catch (err) { alert(err.message); } finally { setDeletingId(null); }
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">הוצאות ({expenses.length})</h3>
        <button onClick={showForm ? closeForm : openAdd} className={showForm ? 'btn-secondary flex items-center gap-2' : 'btn-primary flex items-center gap-2'}>
          {showForm ? <><X size={16} />ביטול</> : <><Plus size={16} />הוסף הוצאה</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 slide-up">
          <h4 className="font-semibold">{editingId ? 'עריכת הוצאה' : 'הוצאה חדשה'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">קטגוריה</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
                {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div><label className="label">תאריך</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input" required /></div>
            <div><label className="label">סכום (₪)</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input" placeholder="0" required dir="ltr" /></div>
          </div>
          <div><label className="label">הערות</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-[60px]" placeholder="פרטים נוספים..." /></div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}{editingId ? 'עדכן הוצאה' : 'שמור הוצאה'}
          </button>
        </form>
      )}

      {expenses.length > 0 && (
        <div className="card p-4 bg-brand-50 text-center">
          <p className="text-sm text-surface-500">סה״כ הוצאות</p>
          <p className="text-2xl font-bold text-brand-700">{formatCurrency(total)}</p>
        </div>
      )}

      {expenses.length === 0 && !showForm ? (
        <EmptyState text="אין הוצאות רשומות" icon="💰" action="הוסף הוצאה ראשונה" onAction={openAdd} />
      ) : expenses.map(e => (
        <div key={e.id} className="card p-4 flex items-center gap-4">
          <span className="text-2xl">{EXPENSE_CATEGORY_ICONS[e.category] || '📦'}</span>
          <div className="flex-1">
            <h4 className="font-medium">{EXPENSE_CATEGORIES[e.category]}</h4>
            <p className="text-sm text-surface-500">{formatDate(e.date)}</p>
            {e.description && <p className="text-sm text-surface-400">{e.description}</p>}
          </div>
          <p className="font-bold">{formatCurrency(Number(e.amount))}</p>
          <div className="flex gap-1">
            <button onClick={() => openEdit(e)} className="p-2 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="ערוך">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="מחק">
              {deletingId === e.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Reminders Tab ───────────────────────────────────────────────────────────

function RemindersTab({ vehicleId, reminders, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const emptyForm = { reminderType: 'OIL', title: '', dueDate: '', dueMileage: '', intervalMonths: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (r) => {
    setForm({
      reminderType: r.reminderType,
      title: r.title ?? '',
      dueDate: r.dueDate ? r.dueDate.split('T')[0] : '',
      dueMileage: r.dueMileage ?? '',
      intervalMonths: r.intervalMonths ?? '',
    });
    setEditingId(r.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        vehicleId,
        reminderType: form.reminderType,
        title: form.title,
        dueDate: form.dueDate || undefined,
        dueMileage: form.dueMileage ? Number(form.dueMileage) : undefined,
        intervalMonths: form.intervalMonths ? Number(form.intervalMonths) : undefined,
      };
      if (editingId) {
        await remindersApi.update(editingId, payload);
      } else {
        await remindersApi.create(payload);
      }
      closeForm();
      onRefresh();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק תזכורת זו?')) return;
    setDeletingId(id);
    try {
      await remindersApi.delete(id);
      onRefresh();
    } catch (err) { alert(err.message); } finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">תזכורות ({reminders.length})</h3>
        <button onClick={showForm ? closeForm : openAdd} className={showForm ? 'btn-secondary flex items-center gap-2' : 'btn-primary flex items-center gap-2'}>
          {showForm ? <><X size={16} />ביטול</> : <><Plus size={16} />הוסף תזכורת</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 slide-up">
          <h4 className="font-semibold">{editingId ? 'עריכת תזכורת' : 'תזכורת חדשה'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">סוג</label>
              <select value={form.reminderType} onChange={e => setForm({...form, reminderType: e.target.value})} className="input">
                {Object.entries(REMINDER_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div><label className="label">כותרת</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" placeholder="החלפת שמן" required /></div>
            <div><label className="label">תאריך יעד</label><input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="input" /></div>
            <div><label className="label">קילומטראז׳ יעד</label><input type="number" value={form.dueMileage} onChange={e => setForm({...form, dueMileage: e.target.value})} className="input" placeholder="150000" dir="ltr" /></div>
            <div><label className="label">חזרה כל (חודשים)</label><input type="number" value={form.intervalMonths} onChange={e => setForm({...form, intervalMonths: e.target.value})} className="input" placeholder="12" dir="ltr" /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}{editingId ? 'עדכן תזכורת' : 'שמור תזכורת'}
          </button>
        </form>
      )}

      {reminders.length === 0 && !showForm ? (
        <EmptyState text="אין תזכורות" icon="🔔" action="הוסף תזכורת ראשונה" onAction={openAdd} />
      ) : reminders.map(r => (
        <div key={r.id} className={`card p-4 flex items-center gap-4 ${r.dueDate && new Date(r.dueDate) < new Date() ? 'border-red-200' : ''}`}>
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <h4 className="font-medium">{r.title}</h4>
            <p className="text-sm text-surface-500">{REMINDER_TYPES[r.reminderType]}</p>
          </div>
          <div className="text-left">
            {r.dueDate && <p className={`text-sm font-medium ${new Date(r.dueDate) < new Date() ? 'text-red-500' : 'text-surface-600'}`}>{formatDate(r.dueDate)}</p>}
            {r.dueMileage && <p className="text-xs text-surface-500">{formatNumber(r.dueMileage)} ק״מ</p>}
          </div>
          <div className="flex gap-1">
            <button onClick={() => openEdit(r)} className="p-2 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="ערוך">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="מחק">
              {deletingId === r.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Details Tab ─────────────────────────────────────────────────────────────

function DetailsTab({ vehicle }) {
  const fields = [
    ['יצרן', vehicle.manufacturer], ['דגם', vehicle.model], ['שנה', vehicle.year],
    ['צבע', vehicle.color], ['דלק', vehicle.fuelType], ['מנוע', vehicle.engineModel],
    ['גימור', vehicle.trim], ['מספר שלדה', vehicle.vin], ['צמיג קדמי', vehicle.frontTire],
    ['צמיג אחורי', vehicle.rearTire], ['עלייה לכביש', vehicle.firstRegistered],
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

function EmptyState({ text, icon, action, onAction }) {
  return (
    <div className="card p-12 text-center">
      <span className="text-4xl block mb-3">{icon}</span>
      <p className="text-surface-500 mb-4">{text}</p>
      {action && <button onClick={onAction} className="btn-primary inline-flex items-center gap-2"><Plus size={16} />{action}</button>}
    </div>
  );
}

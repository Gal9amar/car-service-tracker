import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vehicles as vehiclesApi, services as servicesApi, expenses as expensesApi, reminders as remindersApi, reports, insurances as insurancesApi } from '../services/api';
import { ArrowRight, Wrench, Receipt, Bell, FileText, Plus, X, Calendar, Gauge, Fuel, Palette, Loader2, Pencil, Trash2, RefreshCw, Shield, ClipboardCheck, ImageOff } from 'lucide-react';
import { SERVICE_TYPES, SERVICE_TYPE_ICONS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_ICONS, REMINDER_TYPES, formatCurrency, formatDate, formatNumber } from '../utils/constants';

function VehiclePlate({ number }) {
  const fmt = (n) => {
    const d = (n || '').replace(/[^0-9]/g, '');
    if (d.length === 7) return `${d.slice(0,2)}-${d.slice(2,5)}-${d.slice(5)}`;
    if (d.length === 8) return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;
    return n;
  };
  return (
    <div style={{ display:'inline-flex', alignItems:'stretch', borderRadius:'8px', border:'3px solid #1a1a1a', overflow:'hidden', height:'52px', boxShadow:'0 2px 12px rgba(0,0,0,0.4)', direction:'ltr' }}>
      <div style={{ background:'#003399', width:'40px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px', padding:'4px 2px', flexShrink:0 }}>
        <span style={{ fontSize:'13px', lineHeight:1 }}>🇮🇱</span>
        <span style={{ color:'white', fontSize:'8px', fontWeight:800, lineHeight:1 }}>IL</span>
        <span style={{ color:'white', fontSize:'6px', lineHeight:1 }}>ישראל</span>
      </div>
      <div style={{ background:'#F5C400', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:'26px', fontWeight:900, color:'#1a1a1a', letterSpacing:'3px', fontFamily:'monospace', whiteSpace:'nowrap' }}>
          {fmt(number)}
        </span>
      </div>
    </div>
  );
}

function InfoTile({ label, value, highlight }) {
  const colors = {
    red:   'text-red-400',
    amber: 'text-amber-400',
    green: 'text-emerald-400',
  };
  return (
    <div className="bg-white/8 rounded-xl px-3 py-2.5">
      <p className="text-xs text-white/50 mb-0.5">{label}</p>
      <p className={`text-sm font-bold leading-tight truncate ${highlight ? colors[highlight] : 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [tab, setTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [refreshingImg, setRefreshingImg] = useState(false);
  const [imgToast, setImgToast] = useState(null); // { type, msg }
  const [imgCacheBust, setImgCacheBust] = useState('');

  const fetchVehicle = useCallback(() => {
    setImgError(false);
    vehiclesApi.get(id).then(res => setVehicle(res.vehicle)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchVehicle(); }, [fetchVehicle]);

  const showImgToast = (type, msg) => {
    setImgToast({ type, msg });
    setTimeout(() => setImgToast(null), 4000);
  };

  const handleRefreshImage = async () => {
    setRefreshingImg(true);
    try {
      const res = await vehiclesApi.refreshImage(vehicle.id);
      if (res.imageUrl) {
        // Force browser to re-fetch even if URL is identical
        const bust = `?t=${Date.now()}`;
        setImgCacheBust(bust);
        setVehicle(v => ({ ...v, imageUrl: res.imageUrl }));
        setImgError(false);
        showImgToast('success', 'תמונה עודכנה בהצלחה');
      } else {
        showImgToast('error', 'לא נמצאה תמונה מתאימה');
      }
    } catch (e) {
      console.error(e);
      showImgToast('error', 'שגיאה בטעינת תמונה');
    }
    finally { setRefreshingImg(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!vehicle) return <p className="text-center text-surface-500">רכב לא נמצא</p>;

  const tabs = [
    { id: 'services',   label: 'טיפולים',  icon: Wrench,         count: vehicle.services.length },
    { id: 'expenses',   label: 'הוצאות',   icon: Receipt,        count: vehicle.expenses.length },
    { id: 'reminders',  label: 'תזכורות',  icon: Bell,           count: vehicle.reminders.length },
    { id: 'insurances', label: 'ביטוחים',  icon: Shield },
    { id: 'mot',        label: 'טסט',      icon: ClipboardCheck },
    { id: 'details',    label: 'פרטים',    icon: FileText },
  ];

  // Derive key info for summary cards
  const lastService = vehicle.services?.[0];
  const nextReminder = vehicle.reminders?.filter(r => r.isActive && r.dueDate && new Date(r.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const activeInsurance = vehicle.insurances?.[0]; // may be undefined

  const testExpiry = vehicle.testExpiry ? new Date(vehicle.testExpiry) : null;
  const testDaysLeft = testExpiry ? Math.ceil((testExpiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const testColor = testDaysLeft === null ? 'gray'
    : testDaysLeft < 0 ? 'red'
    : testDaysLeft <= 14 ? 'red'
    : testDaysLeft <= 60 ? 'amber'
    : 'emerald';

  const hasImage = vehicle.imageUrl && !imgError;

  return (
    <div className="space-y-4 fade-in" dir="rtl">

      {/* ── Back + PDF row ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link to="/vehicles" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
          <ArrowRight size={16} />חזרה לרכבים
        </Link>
        <a href={reports.vehiclePdfUrl(vehicle.id)} target="_blank" rel="noopener"
          className="flex items-center gap-1.5 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors text-surface-600 dark:text-surface-300 text-xs font-semibold px-3 py-2 rounded-xl">
          <FileText size={14} />דוח PDF
        </a>
      </div>

      {/* ── Hero card ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-3xl shadow-lg overflow-hidden">

        {/* Car image area */}
        <div className="relative bg-gradient-to-b from-surface-100 to-surface-50 dark:from-surface-700 dark:to-surface-800 h-52 flex items-center justify-center">
          {hasImage ? (
            <img
              src={`${vehicle.imageUrl}${imgCacheBust}`}
              alt={`${vehicle.manufacturer} ${vehicle.model}`}
              className="h-full w-full object-contain p-4 drop-shadow-lg"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-surface-300 dark:text-surface-600">
              <span className="text-7xl">🚗</span>
              <button
                onClick={handleRefreshImage}
                disabled={refreshingImg}
                className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-medium bg-white dark:bg-surface-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                {refreshingImg
                  ? <Loader2 size={12} className="animate-spin" />
                  : <ImageOff size={12} />}
                {refreshingImg ? 'מחפש תמונה...' : 'חפש תמונה'}
              </button>
            </div>
          )}

          {/* Refresh image button — shown when image exists */}
          {hasImage && (
            <button
              onClick={handleRefreshImage}
              disabled={refreshingImg}
              title="רענן תמונה"
              className="absolute top-3 left-3 p-1.5 bg-white/80 dark:bg-surface-800/80 rounded-lg text-surface-400 hover:text-brand-500 transition-colors shadow-sm"
            >
              {refreshingImg ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
          )}

          {/* Recall badge */}
          {vehicle.recalls?.length > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              ⚠️ ריקול
            </div>
          )}
        </div>

        {/* Image toast */}
        {imgToast && (
          <div className={`mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            imgToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <span>{imgToast.type === 'success' ? '✓' : '✗'}</span>
            {imgToast.msg}
          </div>
        )}

        {/* Name + plate */}
        <div className="px-5 pt-4 pb-3 text-center border-b border-surface-100 dark:border-surface-700">
          <p className="text-xs font-medium text-surface-400 uppercase tracking-widest mb-1">{vehicle.manufacturer}</p>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white leading-tight">{vehicle.model}</h1>
          {vehicle.year && <p className="text-sm text-surface-400 mt-0.5">{vehicle.year}</p>}
          <div className="flex justify-center mt-3">
            <VehiclePlate number={vehicle.licensePlate} />
          </div>
        </div>

        {/* Summary info cards */}
        <div className="grid grid-cols-3 divide-x divide-x-reverse divide-surface-100 dark:divide-surface-700">

          {/* Last service */}
          <div className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
              <Wrench size={18} className="text-blue-500" />
            </div>
            <p className="text-xs text-surface-400 mb-0.5">טיפול אחרון</p>
            {lastService ? (
              <>
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-100 leading-tight">{SERVICE_TYPES[lastService.serviceType] || lastService.serviceType}</p>
                <p className="text-xs text-surface-400">{formatDate(lastService.date)}</p>
                {lastService.mileage && <p className="text-xs text-surface-400">לפני {formatNumber(vehicle.currentMileage - lastService.mileage)} ק״מ</p>}
              </>
            ) : (
              <p className="text-xs text-surface-400">אין עדיין</p>
            )}
          </div>

          {/* Test expiry */}
          <div className="p-4 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
              testColor === 'red' ? 'bg-red-50 dark:bg-red-900/30' :
              testColor === 'amber' ? 'bg-amber-50 dark:bg-amber-900/30' :
              'bg-emerald-50 dark:bg-emerald-900/30'
            }`}>
              <ClipboardCheck size={18} className={
                testColor === 'red' ? 'text-red-500' :
                testColor === 'amber' ? 'text-amber-500' :
                'text-emerald-500'
              } />
            </div>
            <p className="text-xs text-surface-400 mb-0.5">תוקף טסט</p>
            {testExpiry ? (
              <>
                <p className={`text-sm font-semibold leading-tight ${
                  testColor === 'red' ? 'text-red-600' :
                  testColor === 'amber' ? 'text-amber-600' :
                  'text-emerald-600'
                }`}>
                  {testDaysLeft < 0 ? 'פג תוקף' : `${testDaysLeft} ימים`}
                </p>
                <p className="text-xs text-surface-400">{formatDate(testExpiry)}</p>
              </>
            ) : (
              <p className="text-xs text-surface-400">לא ידוע</p>
            )}
          </div>

          {/* Next reminder */}
          <div className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-2">
              <Bell size={18} className="text-orange-500" />
            </div>
            <p className="text-xs text-surface-400 mb-0.5">תזכורת הבאה</p>
            {nextReminder ? (
              <>
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-100 leading-tight truncate px-1">{nextReminder.title}</p>
                <p className="text-xs text-surface-400">{formatDate(nextReminder.dueDate)}</p>
                {nextReminder.dueDate && (
                  <p className="text-xs text-surface-400">
                    בעוד {Math.ceil((new Date(nextReminder.dueDate) - new Date()) / (1000*60*60*24))} ימים
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-surface-400">אין תזכורות</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-white dark:bg-surface-700 shadow-sm text-brand-700 dark:text-brand-400' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
            <t.icon size={15} />
            <span>{t.label}</span>
            {t.count !== undefined && <span className="text-xs bg-surface-200 dark:bg-surface-600 px-1 py-0.5 rounded-full leading-none">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'services'   && <ServicesTab vehicleId={vehicle.id} services={vehicle.services} onRefresh={fetchVehicle} />}
      {tab === 'expenses'   && <ExpensesTab vehicleId={vehicle.id} expenses={vehicle.expenses} onRefresh={fetchVehicle} />}
      {tab === 'reminders'  && <RemindersTab vehicleId={vehicle.id} reminders={vehicle.reminders} onRefresh={fetchVehicle} />}
      {tab === 'insurances' && <InsurancesTab vehicleId={vehicle.id} />}
      {tab === 'mot'        && <MotTab vehicle={vehicle} onRefresh={fetchVehicle} />}
      {tab === 'details'    && <DetailsTab vehicle={vehicle} setVehicle={setVehicle} />}
    </div>
  );
}

// ─── Services Tab ────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

function ServicesTab({ vehicleId, services, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const emptyForm = { serviceType: 'PERIODIC', date: new Date().toISOString().split('T')[0], cost: '', mileage: '', nextServiceMileage: '', description: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({
      serviceType: s.serviceType,
      date: s.date ? s.date.split('T')[0] : '',
      cost: s.cost ?? '',
      mileage: s.mileage ?? '',
      nextServiceMileage: s.nextServiceMileage ?? '',
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
        nextServiceMileage: form.nextServiceMileage ? Number(form.nextServiceMileage) : undefined,
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
        {!showForm && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} />הוסף טיפול
          </button>
        )}
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
            <div><label className="label">קילומטראז׳ נוכחי</label><input type="number" value={form.mileage} onChange={e => setForm({...form, mileage: e.target.value})} className="input" placeholder="120000" dir="ltr" /></div>
            {form.serviceType === 'PERIODIC' && (
              <div><label className="label">ק״מ לטיפול הבא</label><input type="number" value={form.nextServiceMileage} onChange={e => setForm({...form, nextServiceMileage: e.target.value})} className="input" placeholder="130000" dir="ltr" /></div>
            )}
          </div>
          <div><label className="label">הערות</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-[60px]" placeholder="פרטים נוספים..." /></div>
          <div className="flex gap-3">
            <button type="button" onClick={closeForm} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <X size={16} />ביטול
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}{editingId ? 'עדכן' : 'שמור'}
            </button>
          </div>
        </form>
      )}

      {services.length === 0 && !showForm ? (
        <EmptyState text="אין טיפולים רשומים" icon="🔧" action="הוסף טיפול ראשון" onAction={openAdd} />
      ) : services.slice(0, visibleCount).map(s => (
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
            {s.nextServiceMileage && <p className="text-xs text-brand-500 font-medium">הבא: {formatNumber(s.nextServiceMileage)} ק״מ</p>}
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
      {services.length > visibleCount && (
        <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="w-full py-2.5 text-sm text-brand-600 hover:text-brand-700 font-medium border border-dashed border-brand-300 rounded-xl hover:bg-brand-50 transition-colors">
          טען עוד ({services.length - visibleCount} נותרו)
        </button>
      )}
    </div>
  );
}

// ─── Expenses Tab ────────────────────────────────────────────────────────────

function ExpensesTab({ vehicleId, expenses, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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

  const monthlyData = (() => {
    const map = {};
    expenses.forEach(e => {
      const key = e.date ? e.date.slice(0, 7) : null;
      if (!key) return;
      map[key] = (map[key] || 0) + Number(e.amount);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  })();

  const maxVal = Math.max(...monthlyData.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">הוצאות ({expenses.length})</h3>
        {!showForm && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} />הוסף הוצאה
          </button>
        )}
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
          <div className="flex gap-3">
            <button type="button" onClick={closeForm} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <X size={16} />ביטול
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}{editingId ? 'עדכן' : 'שמור'}
            </button>
          </div>
        </form>
      )}

      {expenses.length > 0 && (
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">הוצאות לפי חודש</p>
            <div className="text-left">
              <p className="text-xs text-surface-400">סה״כ</p>
              <p className="text-lg font-bold text-brand-600">{formatCurrency(total)}</p>
            </div>
          </div>
          {monthlyData.length > 1 && (
            <div className="flex items-end gap-1 h-20 mt-2">
              {monthlyData.map(([month, val]) => {
                const heightPct = (val / maxVal) * 100;
                const [yr, mo] = month.split('-');
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                      <div
                        className="w-full rounded-t-md bg-brand-400 dark:bg-brand-500 hover:bg-brand-500 dark:hover:bg-brand-400 transition-all relative group"
                        style={{ height: `${heightPct}%`, minHeight: '4px' }}
                        title={`${formatCurrency(val)}`}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-800 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                          {formatCurrency(val)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-surface-400 truncate w-full text-center">{mo}/{yr.slice(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {expenses.length === 0 && !showForm ? (
        <EmptyState text="אין הוצאות רשומות" icon="💰" action="הוסף הוצאה ראשונה" onAction={openAdd} />
      ) : expenses.slice(0, visibleCount).map(e => (
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
      {expenses.length > visibleCount && (
        <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="w-full py-2.5 text-sm text-brand-600 hover:text-brand-700 font-medium border border-dashed border-brand-300 rounded-xl hover:bg-brand-50 transition-colors">
          טען עוד ({expenses.length - visibleCount} נותרו)
        </button>
      )}
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
        {!showForm && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} />הוסף תזכורת
          </button>
        )}
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
          <div className="flex gap-3">
            <button type="button" onClick={closeForm} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <X size={16} />ביטול
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}{editingId ? 'עדכן' : 'שמור'}
            </button>
          </div>
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

function DField({ label, value }) {
  if (value === null || value === undefined || value === '' || value === false) return null;
  return (
    <div>
      <p className="text-xs text-surface-400 mb-0.5">{label}</p>
      <p className="font-medium text-sm">{value === true ? '✓' : value}</p>
    </div>
  );
}

function DSection({ title, children }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function DetailsTab({ vehicle, setVehicle }) {
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg: string }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await vehiclesApi.refresh(vehicle.id);
      setVehicle(prev => ({ ...prev, ...res.vehicle }));
      showToast('success', 'נתוני הרכב עודכנו בהצלחה');
    } catch (err) {
      showToast('error', err.message || 'שגיאה בעדכון הנתונים');
    } finally {
      setRefreshing(false);
    }
  };

  const fmtUpdated = (dt) => {
    if (!dt) return null;
    return new Date(dt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const fmtDate = (yyyymm) => {
    if (!yyyymm) return '';
    const s = String(yyyymm);
    if (s.length === 6) return `${s.slice(4,6)}/${s.slice(0,4)}`;
    return s;
  };

  const recalls = vehicle.recalls || [];
  const ownershipHistory = vehicle.ownershipHistory || [];

  const safetyFeatures = [
    vehicle.hasABS           && 'ABS',
    vehicle.hasStabControl   && 'יציבות אקטיבית (ESC)',
    vehicle.hasPowerSteering && 'הגה כוח',
    vehicle.hasAC            && 'מיזוג אוויר',
    vehicle.hasSunroof       && 'גג שמש',
    vehicle.hasAlloyWheels   && 'גלגלי סגסוגת',
    vehicle.hasTrunkRack     && 'ארגז גג',
    vehicle.hasRearCamera    && 'מצלמת אחור',
    vehicle.hasTirePressure  && 'חיישני לחץ צמיגים',
    vehicle.hasFatigueAlert  && 'התראת עייפות',
  ].filter(Boolean);

  const safetyTech = [
    vehicle.hasLaneDeparture      && 'התראת יציאת נתיב',
    vehicle.hasForwardWarning     && 'התראת מרחק קדמי',
    vehicle.hasBlindSpot          && 'זיהוי שטח סמוי',
    vehicle.hasAdaptiveCruise     && 'שיוט אדפטיבי',
    vehicle.hasPedestrianDetect   && 'זיהוי הולכי רגל',
    vehicle.hasAutoEmergencyBrake && 'בלימת חירום אוטומטית',
    vehicle.hasAutoHighBeam       && 'שליטה אוטומטית באורות גבוהים',
    vehicle.hasSpeedLimiter       && 'מגביל מהירות',
    vehicle.hasAlcoLock           && 'נעילת אלכוהול',
  ].filter(Boolean);

  return (
    <div className="space-y-4">

      {/* ── Refresh bar ──────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-surface-400">
          {vehicle.govDataUpdatedAt
            ? `עודכן לאחרונה: ${fmtUpdated(vehicle.govDataUpdatedAt)}`
            : 'נתוני ממשלה לא עודכנו עדיין'}
        </p>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 disabled:opacity-50 transition-colors">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'מעדכן...' : 'רענן נתונים'}
        </button>
      </div>
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}
      {recalls.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="font-bold text-red-600 dark:text-red-400 mb-3">⚠️ קריאות שירות פתוחות ({recalls.length})</p>
          {recalls.map((rc, i) => (
            <div key={i} className="text-sm border-t border-red-100 dark:border-red-800 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
              <p className="font-semibold text-red-700 dark:text-red-300">{rc.system}</p>
              <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">{rc.description}</p>
              {rc.openedDate && <p className="text-red-400 text-xs mt-0.5 opacity-70">נפתח: {rc.openedDate}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Change alerts ────────────────────────── */}
      {(vehicle.structureChange || vehicle.colorChange || vehicle.tireChange || vehicle.hasGrapam) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <p className="font-bold text-amber-700 dark:text-amber-400 mb-2">שינויים שדווחו</p>
          <div className="flex flex-wrap gap-2">
            {vehicle.structureChange && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg">שינוי מבנה</span>}
            {vehicle.colorChange     && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg">שינוי צבע</span>}
            {vehicle.tireChange      && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg">שינוי צמיגים</span>}
            {vehicle.hasGrapam       && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded-lg">גרפ"מ</span>}
          </div>
        </div>
      )}

      {/* ── Basic info ───────────────────────────── */}
      <DSection title="פרטי רכב">
        <DField label="מספר רכב"    value={vehicle.licensePlate} />
        <DField label="יצרן"         value={vehicle.manufacturer} />
        <DField label="כינוי מסחרי"  value={vehicle.model} />
        <DField label="קוד דגם"      value={vehicle.modelCode} />
        <DField label="שנת ייצור"    value={vehicle.year} />
        <DField label="סוג רכב"      value={vehicle.vehicleType === 'P' ? 'פרטי' : vehicle.vehicleType === 'M' ? 'מסחרי' : vehicle.vehicleType} />
        <DField label="צבע"           value={vehicle.color} />
        <DField label="דלק"           value={vehicle.fuelType} />
        <DField label="דגם מנוע"     value={vehicle.engineModel} />
        <DField label="מספר מנוע"    value={vehicle.engineNumber} />
        <DField label="גימור"         value={vehicle.trim} />
        <DField label="מספר שלדה"    value={vehicle.vin} />
        <DField label="צמיג קדמי"    value={vehicle.frontTire} />
        <DField label="צמיג אחורי"   value={vehicle.rearTire} />
        <DField label="עלייה לכביש"  value={vehicle.firstRegistered} />
        <DField label="רישום ראשון"  value={vehicle.firstRegisteredDate?.split('T')[0]} />
        <DField label="בעלות"         value={vehicle.ownership} />
        <DField label="טסט אחרון"    value={vehicle.lastTest?.toString().split('T')[0]} />
        <DField label="תוקף רישוי"   value={vehicle.testExpiry?.toString().split('T')[0]} />
        <DField label="מקוריות"       value={vehicle.origin} />
        <DField label="רמת זיהום"    value={vehicle.pollutionLevel ? `קבוצה ${vehicle.pollutionLevel}` : null} />
        <DField label="דירוג בטיחות" value={vehicle.safetyRating} />
        <DField label="הערת רישום"   value={vehicle.registrationNote} />
      </DSection>

      {/* ── Test KM ──────────────────────────────── */}
      {vehicle.testKm > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-2">ק"מ בטסט האחרון</p>
          <p className="text-3xl font-black text-brand-600 mt-1">
            {vehicle.testKm.toLocaleString('he-IL')}
            <span className="text-sm font-normal text-surface-400 mr-1"> ק"מ</span>
          </p>
          <p className="text-xs text-surface-400 mt-1">נרשם ע"י מכון הרישוי בבדיקה האחרונה</p>
        </div>
      )}

      {/* ── Specs ────────────────────────────────── */}
      <DSection title="מפרט טכני">
        <DField label="כוח סוס"       value={vehicle.horsePower ? `${vehicle.horsePower} כ"ס` : '-'} />
        <DField label="נפח מנוע"      value={vehicle.engineCC   ? `${vehicle.engineCC} סמ"ק` : '-'} />
        <DField label="משקל כולל"     value={vehicle.weight     ? `${vehicle.weight} ק"ג` : '-'} />
        <DField label="סוג מרכב"      value={vehicle.bodyType ?? '-'} />
        <DField label="הנעה"           value={vehicle.driveType ?? '-'} />
        <DField label="תיבת הילוכים"  value={vehicle.transmission ?? '-'} />
        <DField label="דלתות"          value={vehicle.doors ?? '-'} />
        <DField label="מושבים"         value={vehicle.seats ?? '-'} />
        <DField label="תקן"            value={vehicle.standardType ?? '-'} />
        <DField label="גרירה עם בלמים"  value={vehicle.towingWithBrakes    ? `${vehicle.towingWithBrakes} ק"ג`    : '-'} />
        <DField label="גרירה ללא בלמים" value={vehicle.towingWithoutBrakes ? `${vehicle.towingWithoutBrakes} ק"ג` : '-'} />
        <DField label="כריות אוויר"    value={vehicle.airbags ?? '-'} />
        <DField label="חלונות חשמל"    value={vehicle.electricWindows ?? '-'} />
      </DSection>

      {/* ── Emissions ────────────────────────────── */}
      <DSection title="פליטות וסביבה">
        <DField label="CO₂ כללי"       value={vehicle.co2        ? `${vehicle.co2} גר/ק"מ`       : '-'} />
        <DField label="CO₂ עיר"        value={vehicle.co2City    ? `${vehicle.co2City} גר/ק"מ`    : '-'} />
        <DField label="CO₂ כביש מהיר"  value={vehicle.co2Highway ? `${vehicle.co2Highway} גר/ק"מ` : '-'} />
        <DField label="NOx"             value={vehicle.nox        ? `${vehicle.nox} גר/ק"מ`       : '-'} />
        <DField label="CO"              value={vehicle.co         ? `${vehicle.co} גר/ק"מ`        : '-'} />
        <DField label="מדד ירוק"       value={vehicle.greenScore ?? '-'} />
        <DField label="רמת זיהום"      value={vehicle.pollutionLevel ? `קבוצה ${vehicle.pollutionLevel}` : '-'} />
      </DSection>

      {/* ── Equipment & Safety ───────────────────── */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">ציוד ובטיחות</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            ['ABS',                    vehicle.hasABS],
            ['יציבות אקטיבית (ESC)',   vehicle.hasStabControl],
            ['הגה כוח',                vehicle.hasPowerSteering],
            ['מיזוג אוויר',            vehicle.hasAC],
            ['גג שמש',                 vehicle.hasSunroof],
            ['גלגלי סגסוגת',           vehicle.hasAlloyWheels],
            ['ארגז גג',                vehicle.hasTrunkRack],
            ['מצלמת אחור',             vehicle.hasRearCamera],
            ['חיישני לחץ צמיגים',      vehicle.hasTirePressure],
            ['התראת עייפות',           vehicle.hasFatigueAlert],
            ['התראת יציאת נתיב',       vehicle.hasLaneDeparture],
            ['התראת מרחק קדמי',        vehicle.hasForwardWarning],
            ['זיהוי שטח סמוי',         vehicle.hasBlindSpot],
            ['שיוט אדפטיבי',           vehicle.hasAdaptiveCruise],
            ['זיהוי הולכי רגל',        vehicle.hasPedestrianDetect],
            ['בלימת חירום אוטומטית',   vehicle.hasAutoEmergencyBrake],
            ['שליטה אוטומטית באורות',  vehicle.hasAutoHighBeam],
            ['מגביל מהירות',           vehicle.hasSpeedLimiter],
            ['נעילת אלכוהול',          vehicle.hasAlcoLock],
            ['שינוי מבנה',             vehicle.structureChange],
            ['שינוי צבע',              vehicle.colorChange],
            ['שינוי צמיגים',           vehicle.tireChange],
            ['גרפ"מ',                 vehicle.hasGrapam],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`text-sm font-bold ${val ? 'text-emerald-500' : 'text-red-400'}`}>{val ? '✓' : '✗'}</span>
              <span className="text-sm text-surface-600 dark:text-surface-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ownership history ────────────────────── */}
      {ownershipHistory.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">היסטוריית בעלות ({ownershipHistory.length} רשומות)</p>
          <div className="space-y-0">
            {ownershipHistory.map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-surface-100 dark:border-surface-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{o.type}</span>
                </div>
                <span className="text-xs text-surface-400 font-mono">{fmtDate(o.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MOT (Test) Tab ──────────────────────────────────────────────────────────
function MotTab({ vehicle, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  const now        = new Date();
  const expiry     = vehicle.testExpiry ? new Date(vehicle.testExpiry) : null;
  const lastTest   = vehicle.lastTest   ? new Date(vehicle.lastTest)   : null;
  const daysLeft   = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;
  const isExpired  = daysLeft !== null && daysLeft < 0;
  const isUrgent   = daysLeft !== null && daysLeft <= 7  && !isExpired;
  const isWarning  = daysLeft !== null && daysLeft <= 30 && !isUrgent && !isExpired;

  const fmt = d => d ? new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const hasReminder = vehicle.reminders?.some(r => r.reminderType === 'TEST' && r.isActive);

  const handleSetReminder = async () => {
    if (!expiry || hasReminder) return;
    setSaving(true);
    try {
      await remindersApi.create({
        vehicleId:     vehicle.id,
        reminderType:  'TEST',
        title:         'טסט שנתי',
        dueDate:       expiry.toISOString().split('T')[0],
        intervalMonths: 12,
      });
      setDone(true);
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const statusColor = isExpired ? 'red' : isUrgent ? 'red' : isWarning ? 'amber' : 'emerald';
  const statusBg    = { red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' }[statusColor];
  const statusText  = { red: 'text-red-700 dark:text-red-400', amber: 'text-amber-700 dark:text-amber-400', emerald: 'text-emerald-700 dark:text-emerald-400' }[statusColor];

  return (
    <div className="space-y-4">

      {/* Status banner */}
      {expiry && (
        <div className={`rounded-2xl border p-5 ${statusBg}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {isExpired ? '🚨' : isUrgent ? '⚠️' : isWarning ? '📅' : '✅'}
            </span>
            <div>
              <p className={`font-bold text-lg ${statusText}`}>
                {isExpired
                  ? `פג תוקף לפני ${Math.abs(daysLeft)} ימים`
                  : `${daysLeft} ימים עד לפקיעה`}
              </p>
              <p className={`text-sm ${statusText} opacity-80`}>
                תוקף עד: {fmt(expiry)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!expiry && (
        <div className="card p-5 text-center text-surface-400">
          <ClipboardCheck size={36} className="mx-auto mb-2 opacity-40" />
          <p>אין מידע על טסט — יתעדכן בריענון נתוני הרכב</p>
        </div>
      )}

      {/* Details */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-4">פרטי טסט</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-surface-400 mb-0.5">טסט אחרון</p>
            <p className="font-medium">{fmt(lastTest)}</p>
          </div>
          <div>
            <p className="text-xs text-surface-400 mb-0.5">תוקף רישוי</p>
            <p className="font-medium">{fmt(expiry)}</p>
          </div>
          {vehicle.testKm > 0 && (
            <div>
              <p className="text-xs text-surface-400 mb-0.5">ק"מ בטסט האחרון</p>
              <p className="font-medium">{vehicle.testKm?.toLocaleString('he-IL')} ק"מ</p>
            </div>
          )}
          {daysLeft !== null && !isExpired && (
            <div>
              <p className="text-xs text-surface-400 mb-0.5">ימים שנותרו</p>
              <p className={`font-bold ${statusText}`}>{daysLeft} ימים</p>
            </div>
          )}
        </div>
      </div>

      {/* Reminder */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">תזכורת לטסט</p>
        {hasReminder ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <span>✓</span>
            <p className="text-sm font-medium">תזכורת פעילה — תישלח מייל 30 ו-7 ימים לפני הפקיעה</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-surface-500">אין תזכורת פעילה לטסט</p>
            <button
              onClick={handleSetReminder}
              disabled={saving || !expiry || done}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
              {done ? 'נוצרה בהצלחה ✓' : 'קבע תזכורת לטסט'}
            </button>
          </div>
        )}
      </div>


      {/* ── פרטי הרכב ──────────────────────────── */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">פרטי הרכב</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            ['יצרן',           vehicle.manufacturer ?? '-'],
            ['דגם',            vehicle.model ?? '-'],
            ['שנה',            vehicle.year ?? '-'],
            ['גימור',          vehicle.trim ?? '-'],
            ['צבע',            vehicle.color ?? '-'],
            ['סוג דלק',        vehicle.fuelType ?? '-'],
            ['מנוע',           vehicle.engineModel ?? '-'],
            ['נפח מנוע',       vehicle.engineCC ? `${vehicle.engineCC} סמ"ק` : '-'],
            ['כוח סוס',        vehicle.horsePower ? `${vehicle.horsePower} כ"ס` : '-'],
            ['תיבת הילוכים',   vehicle.transmission ?? '-'],
            ['הנעה',           vehicle.driveType ?? '-'],
            ['סוג מרכב',       vehicle.bodyType ?? '-'],
            ['מספר דלתות',     vehicle.doors ?? '-'],
            ['מספר מושבים',    vehicle.seats ?? '-'],
            ['משקל',           vehicle.weight ? `${vehicle.weight} ק"ג` : '-'],
            ['גרירה עם בלמים', vehicle.towingWithBrakes ? `${vehicle.towingWithBrakes} ק"ג` : '-'],
            ['גרירה ללא בלמים',vehicle.towingWithoutBrakes ? `${vehicle.towingWithoutBrakes} ק"ג` : '-'],
            ['צמיג קדמי',      vehicle.frontTire ?? '-'],
            ['צמיג אחורי',     vehicle.rearTire ?? '-'],
            ['כריות אוויר',    vehicle.airbags ?? '-'],
            ['חלונות חשמל',    vehicle.electricWindows ?? '-'],
            ['מספר שלדה',      vehicle.vin ?? '-'],
            ['בעלות',          vehicle.ownership ?? '-'],
            ['מקור',           vehicle.origin ?? '-'],
            ['סטנדרט',         vehicle.standardType ?? '-'],
            ['ציון ירוק',      vehicle.greenScore ?? '-'],
            ['רמת זיהום',      vehicle.pollutionLevel ?? '-'],
            ['CO2',            vehicle.co2 ? `${vehicle.co2} גר/ק"מ` : '-'],
            ['CO',             vehicle.co ?? '-'],
            ['NOx',            vehicle.nox ?? '-'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-surface-400 mb-0.5">{label}</p>
              <p className="font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ציוד בטיחות ──────────────────────────── */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">ציוד ובטיחות</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            ['ABS',                    vehicle.hasABS],
            ['יציבות אקטיבית (ESC)',   vehicle.hasStabControl],
            ['הגה כוח',                vehicle.hasPowerSteering],
            ['מיזוג אוויר',            vehicle.hasAC],
            ['גג שמש',                 vehicle.hasSunroof],
            ['גלגלי סגסוגת',           vehicle.hasAlloyWheels],
            ['ארגז גג',                vehicle.hasTrunkRack],
            ['מצלמת אחור',             vehicle.hasRearCamera],
            ['חיישני לחץ צמיגים',      vehicle.hasTirePressure],
            ['התראת עייפות',           vehicle.hasFatigueAlert],
            ['התראת יציאת נתיב',       vehicle.hasLaneDeparture],
            ['התראת מרחק קדמי',        vehicle.hasForwardWarning],
            ['זיהוי שטח סמוי',         vehicle.hasBlindSpot],
            ['שיוט אדפטיבי',           vehicle.hasAdaptiveCruise],
            ['זיהוי הולכי רגל',        vehicle.hasPedestrianDetect],
            ['בלימת חירום אוטומטית',   vehicle.hasAutoEmergencyBrake],
            ['שליטה אוטומטית באורות',  vehicle.hasAutoHighBeam],
            ['מגביל מהירות',           vehicle.hasSpeedLimiter],
            ['נעילת אלכוהול',          vehicle.hasAlcoLock],
            ['שינוי מבנה',             vehicle.structureChange],
            ['שינוי צבע',              vehicle.colorChange],
            ['שינוי צמיגים',           vehicle.tireChange],
            ['גרפם',                   vehicle.hasGrapam],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`text-sm font-bold ${val ? 'text-emerald-500' : 'text-red-400'}`}>{val ? '✓' : '✗'}</span>
              <span className="text-sm text-surface-600 dark:text-surface-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh note */}
      <p className="text-xs text-surface-400 text-center">
        הנתונים מתעדכנים אוטומטית מרשות הרישוי בכל פעם שמרעננים את פרטי הרכב
      </p>
    </div>
  );
}

// ─── Insurances Tab ──────────────────────────────────────────────────────────
const INSURANCE_TYPES = [
  { value: 'MANDATORY',    label: 'חובה' },
  { value: 'THIRD_PARTY',  label: "צד ג'" },
  { value: 'COMPREHENSIVE',label: 'מקיף' },
];

function InsurancesTab({ vehicleId }) {
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const empty = { insuranceType: 'MANDATORY', company: '', startDate: '', endDate: '', cost: '', notes: '' };
  const [form, setForm]           = useState(empty);

  const calcEndDate = (start) => {
    if (!start) return '';
    const d = new Date(start);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const handleStartDateChange = (val) => {
    setForm(f => ({ ...f, startDate: val, endDate: calcEndDate(val) }));
  };

  const load = () => {
    setLoading(true);
    insurancesApi.list(vehicleId)
      .then(r => setList(r.insurances))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useState(() => { load(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [, setInit] = useState(() => { load(); return null; });
  void setInit;

  const openAdd  = ()  => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (ins) => {
    setForm({
      insuranceType: ins.insuranceType,
      company:       ins.company,
      startDate:     ins.startDate?.toString().split('T')[0] || '',
      endDate:       ins.endDate?.toString().split('T')[0]   || '',
      cost:          ins.cost ? String(ins.cost) : '',
      notes:         ins.notes || '',
    });
    setEditingId(ins.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.company || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      const payload = { ...form, vehicleId, cost: form.cost ? Number(form.cost) : null };
      if (editingId) await insurancesApi.update(editingId, payload);
      else            await insurancesApi.create(payload);
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await insurancesApi.delete(id); load(); }
    catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const typeLabel = Object.fromEntries(INSURANCE_TYPES.map(t => [t.value, t.label]));
  const fmt = d => d ? new Date(d).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' }) : '—';
  const daysLeft = d => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));

  const active   = list.filter(i => i.isActive);
  const inactive = list.filter(i => !i.isActive);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-500" size={28} /></div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> הוסף ביטוח
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 space-y-4" dir="rtl">
          <h3 className="font-bold text-right">{editingId ? 'עריכת ביטוח' : 'ביטוח חדש'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-right block">סוג ביטוח</label>
              <select className="input text-right" value={form.insuranceType} onChange={e => setForm(f => ({...f, insuranceType: e.target.value}))}>
                {INSURANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-right block">חברת ביטוח *</label>
              <input className="input text-right" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="מנורה, הפניקס..." />
            </div>
            <div>
              <label className="label text-right block">תאריך תחילה *</label>
              <input type="date" className="input" value={form.startDate} onChange={e => handleStartDateChange(e.target.value)} />
            </div>
            <div>
              <label className="label text-right block">תאריך סיום</label>
              <input type="date" className="input" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} />
              {form.startDate && <p className="text-xs text-surface-400 mt-1 text-right">מחושב אוטומטית — ניתן לשנות</p>}
            </div>
            <div>
              <label className="label text-right block">פרמיה שנתית (₪)</label>
              <input type="number" className="input text-right" value={form.cost} onChange={e => setForm(f => ({...f, cost: e.target.value}))} />
            </div>
            <div>
              <label className="label text-right block">הערות</label>
              <input className="input text-right" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary">ביטול</button>
            <button onClick={handleSave} disabled={saving || !form.company || !form.startDate || !form.endDate} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              שמור
            </button>
          </div>
        </div>
      )}

      {/* Active insurances */}
      {active.length === 0 && !showForm && (
        <div className="card p-10 text-center">
          <Shield size={40} className="mx-auto text-surface-300 mb-3" />
          <p className="text-surface-500">אין ביטוחים פעילים</p>
          <button onClick={openAdd} className="btn-primary mt-4 inline-flex items-center gap-2"><Plus size={16}/>הוסף ביטוח</button>
        </div>
      )}

      {active.map(ins => {
        const dl = daysLeft(ins.endDate);
        const urgent = dl <= 7;
        const warn   = dl <= 30;
        return (
          <div key={ins.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  ins.insuranceType === 'MANDATORY'    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  ins.insuranceType === 'THIRD_PARTY'  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}>{typeLabel[ins.insuranceType]}</span>
                <span className="font-semibold">{ins.company}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(ins)} className="p-1.5 text-surface-400 hover:text-brand-600 transition-colors"><Pencil size={15}/></button>
                <button onClick={() => handleDelete(ins.id)} disabled={deletingId === ins.id} className="p-1.5 text-surface-400 hover:text-red-500 transition-colors">
                  {deletingId === ins.id ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-xs text-surface-400">תחילה</p><p className="font-medium">{fmt(ins.startDate)}</p></div>
              <div><p className="text-xs text-surface-400">סיום</p><p className="font-medium">{fmt(ins.endDate)}</p></div>
              {ins.cost && <div><p className="text-xs text-surface-400">פרמיה</p><p className="font-medium">₪{Number(ins.cost).toLocaleString('he-IL')}</p></div>}
            </div>
            {warn && (
              <div className={`mt-3 text-xs font-medium px-3 py-2 rounded-lg ${urgent ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                {urgent ? '⚠️' : '📅'} פג תוקף בעוד {dl} ימים
              </div>
            )}
            {ins.notes && <p className="mt-2 text-xs text-surface-400">{ins.notes}</p>}
          </div>
        );
      })}

      {/* Inactive / history */}
      {inactive.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm text-surface-500 font-medium">היסטוריה ({inactive.length})</summary>
          <div className="mt-3 space-y-2">
            {inactive.map(ins => (
              <div key={ins.id} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-700 last:border-0 opacity-60">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{typeLabel[ins.insuranceType]}</span>
                  <span className="text-surface-400">·</span>
                  <span>{ins.company}</span>
                </div>
                <span className="text-xs text-surface-400">{fmt(ins.endDate)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
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

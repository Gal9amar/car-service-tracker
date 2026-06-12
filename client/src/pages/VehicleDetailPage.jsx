import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vehicles as vehiclesApi, services as servicesApi, expenses as expensesApi, reminders as remindersApi, reports, insurances as insurancesApi } from '../services/api';
import { ArrowRight, Wrench, Receipt, Bell, FileText, Plus, X, Calendar, Gauge, Fuel, Palette, Loader2, Pencil, Trash2, RefreshCw, Shield, ClipboardCheck, ImageOff, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { SERVICE_TYPES, SERVICE_TYPE_ICONS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_ICONS, REMINDER_TYPES, formatCurrency, formatDate, formatNumber } from '../utils/constants';

function VehiclePlate({ number }) {
  const fmt = (n) => {
    const d = (n || '').replace(/[^0-9]/g, '');
    if (d.length === 7) return `${d.slice(0,2)}-${d.slice(2,5)}-${d.slice(5)}`;
    if (d.length === 8) return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;
    return n;
  };
  return (
    <div style={{ display:'inline-flex', alignItems:'stretch', borderRadius:'8px', border:'3px solid #1a1a1a', overflow:'hidden', height:'44px', boxShadow:'0 2px 8px rgba(0,0,0,0.25)', direction:'ltr' }}>
      <div style={{ background:'#003399', width:'34px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px', padding:'4px 2px', flexShrink:0 }}>
        <span style={{ fontSize:'11px', lineHeight:1 }}>🇮🇱</span>
        <span style={{ color:'white', fontSize:'7px', fontWeight:800, lineHeight:1 }}>IL</span>
        <span style={{ color:'white', fontSize:'5px', lineHeight:1 }}>ישראל</span>
      </div>
      <div style={{ background:'#F5C400', padding:'0 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:'22px', fontWeight:900, color:'#1a1a1a', letterSpacing:'2px', fontFamily:'monospace', whiteSpace:'nowrap' }}>
          {fmt(number)}
        </span>
      </div>
    </div>
  );
}

// ── Expandable section ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, iconColor, iconBg, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-right"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <span className="flex-1 font-bold text-surface-800 dark:text-white text-sm">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400 px-2 py-0.5 rounded-full font-medium">{count}</span>
        )}
        {open ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
      </button>
      {open && <div className="border-t border-surface-100 dark:border-surface-700">{children}</div>}
    </div>
  );
}

// ── Info row card (like the mockup rows) ─────────────────────────────────────
function InfoRow({ icon: Icon, iconColor, iconBg, title, subtitle, extra, right, rightSub, onEdit, onDelete, deleting, urgentBorder }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 border-b border-surface-50 dark:border-surface-700/50 last:border-0 ${urgentBorder ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-surface-800 dark:text-white text-sm leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
        {extra && <p className="text-xs text-surface-400 mt-0.5">{extra}</p>}
      </div>
      <div className="text-left flex-shrink-0">
        {right && <p className="text-sm font-bold text-surface-700 dark:text-surface-200">{right}</p>}
        {rightSub && <p className="text-xs text-surface-400 mt-0.5">{rightSub}</p>}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-0.5 flex-shrink-0">
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 text-surface-300 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} disabled={deleting} className="p-1.5 text-surface-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [refreshingImg, setRefreshingImg] = useState(false);
  const [imgToast, setImgToast] = useState(null);
  const [imgCacheBust, setImgCacheBust] = useState('');

  const [marketPrice, setMarketPrice] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketFetched, setMarketFetched] = useState(false);

  const fetchVehicle = useCallback(() => {
    setImgError(false);
    vehiclesApi.get(id).then(res => setVehicle(res.vehicle)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchVehicle(); }, [fetchVehicle]);

  const fetchMarketPrice = () => {
    if (marketLoading || marketFetched) return;
    setMarketLoading(true);
    vehiclesApi.marketPrice(id)
      .then(res => setMarketPrice(res.marketPrice))
      .catch(console.error)
      .finally(() => { setMarketLoading(false); setMarketFetched(true); });
  };

  const showImgToast = (type, msg) => {
    setImgToast({ type, msg });
    setTimeout(() => setImgToast(null), 4000);
  };

  const handleRefreshImage = async () => {
    setRefreshingImg(true);
    try {
      const res = await vehiclesApi.refreshImage(vehicle.id);
      if (res.imageUrl) {
        setImgCacheBust(`?t=${Date.now()}`);
        setVehicle(v => ({ ...v, imageUrl: res.imageUrl }));
        setImgError(false);
        showImgToast('success', 'תמונה עודכנה בהצלחה');
      } else {
        showImgToast('error', 'לא נמצאה תמונה מתאימה');
      }
    } catch {
      showImgToast('error', 'שגיאה בטעינת תמונה');
    } finally { setRefreshingImg(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!vehicle) return <p className="text-center text-surface-500 py-12">רכב לא נמצא</p>;

  const hasImage = vehicle.imageUrl && !imgError;

  const lastService  = vehicle.services?.[0];
  const nextReminder = vehicle.reminders?.filter(r => r.isActive && r.dueDate && new Date(r.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  const testExpiry  = vehicle.testExpiry ? new Date(vehicle.testExpiry) : null;
  const testDaysLeft = testExpiry ? Math.ceil((testExpiry - new Date()) / (1000*60*60*24)) : null;
  const testColor   = testDaysLeft === null ? 'gray' : testDaysLeft < 0 ? 'red' : testDaysLeft <= 30 ? 'amber' : 'emerald';

  return (
    <div className="space-y-3 fade-in pb-8" dir="rtl">

      {/* Back + PDF */}
      <div className="flex items-center justify-between pt-1">
        <Link to="/vehicles" className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#0066CC' }}>
          <ArrowRight size={16} />חזרה לרכבים
        </Link>
        <a href={reports.vehiclePdfUrl(vehicle.id)} target="_blank" rel="noopener"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          style={{ background: '#F0F4F8', color: '#556F8A' }}>
          <FileText size={14} />דוח PDF
        </a>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
        {/* BYD color band */}
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' }} />
        {/* Image */}
        <div className="relative bg-gradient-to-b from-surface-50 to-white dark:from-surface-700 dark:to-surface-800 flex items-center justify-center p-3">
          {hasImage ? (
            <>
              <div className="relative w-full h-44 overflow-hidden" style={{ borderRadius: '20px' }}>
                <img
                  src={`${vehicle.imageUrl}${imgCacheBust}`}
                  alt={`${vehicle.manufacturer} ${vehicle.model}`}
                  className="h-full w-full object-cover drop-shadow-md"
                  onError={() => setImgError(true)}
                />
              </div>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-white bg-blue-900 px-2 py-0.5 rounded-full pointer-events-none select-none whitespace-nowrap">
                תמונה להמחשה בלבד
              </span>
              <button
                onClick={handleRefreshImage}
                disabled={refreshingImg}
                title="רענן תמונה"
                className="absolute top-2 left-2 p-1.5 bg-white/80 dark:bg-surface-800/80 rounded-lg text-surface-400 hover:text-brand-500 transition-colors shadow-sm"
              >
                {refreshingImg ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-surface-300 dark:text-surface-600">
              <span className="text-6xl">🚗</span>
              <button
                onClick={handleRefreshImage}
                disabled={refreshingImg}
                className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-medium bg-white dark:bg-surface-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                {refreshingImg ? <Loader2 size={12} className="animate-spin" /> : <ImageOff size={12} />}
                {refreshingImg ? 'מחפש תמונה...' : 'חפש תמונה'}
              </button>
            </div>
          )}
          {vehicle.recalls?.length > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              ⚠️ ריקול
            </div>
          )}
        </div>

        {imgToast && (
          <div className={`mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            imgToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <span>{imgToast.type === 'success' ? '✓' : '✗'}</span>
            {imgToast.msg}
          </div>
        )}

        {/* Name + plate */}
        <div className="px-5 pt-4 pb-5 text-center">
          <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-widest mb-0.5">{vehicle.manufacturer}</p>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white leading-tight">{vehicle.model}</h1>
          {vehicle.year && <p className="text-sm text-surface-400 mt-0.5 mb-3">{vehicle.year}</p>}
          <div className="flex justify-center">
            <VehiclePlate number={vehicle.licensePlate} />
          </div>
        </div>
      </div>

      {/* ── Market Price (Yad2) ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' }} />
        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-900/30 flex-shrink-0">
                <TrendingUp size={18} className="text-teal-600" />
              </div>
              <div>
                <p className="font-bold text-surface-800 dark:text-white text-sm">מחיר שוק יד2</p>
                <p className="text-[11px] text-surface-400">
                  {marketPrice
                    ? `${marketPrice.manufacturer} ${marketPrice.model} ${marketPrice.year}`
                    : 'לחץ לבדיקת מחיר ממוצע'}
                </p>
              </div>
            </div>
            {!marketFetched ? (
              <button
                onClick={fetchMarketPrice}
                disabled={marketLoading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 text-white"
                style={{ background: 'linear-gradient(135deg, #0066CC 0%, #00B4A0 100%)', boxShadow: '0 3px 10px rgba(0,102,204,0.3)' }}
              >
                {marketLoading
                  ? <><Loader2 size={13} className="animate-spin" />טוען...</>
                  : <>בדוק מחיר</>}
              </button>
            ) : marketPrice?.prices ? (
              <button
                onClick={() => { setMarketFetched(false); setMarketPrice(null); }}
                className="text-xs text-surface-400 hover:text-surface-600 px-2 py-1 rounded-lg hover:bg-surface-50"
              >
                <RefreshCw size={13} />
              </button>
            ) : null}
          </div>

          {marketPrice?.prices && (
            <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
              {/* Average price — big */}
              <div className="text-center mb-3">
                <p className="text-[11px] text-surface-400 mb-0.5">מחיר ממוצע</p>
                <p className="text-2xl font-black" style={{ color: '#0066CC' }} dir="ltr">
                  ₪{marketPrice.prices.avg.toLocaleString('he-IL')}
                </p>
                {marketPrice.totalOnRoad > 0 && (
                  <p className="text-[11px] text-surface-400 mt-0.5">{marketPrice.totalOnRoad} מכוניות למכירה ביד2</p>
                )}
              </div>
              {/* Min / Median / Max */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-xl px-2 py-2 text-center" style={{ background: '#F0FFF4' }}>
                  <p className="text-xs font-black text-emerald-600" dir="ltr">₪{marketPrice.prices.min.toLocaleString('he-IL')}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">מינימום</p>
                </div>
                <div className="rounded-xl px-2 py-2 text-center" style={{ background: '#EFF6FF' }}>
                  {marketPrice.prices.avgKm
                    ? <p className="text-xs font-black text-blue-600" dir="ltr">{marketPrice.prices.avgKm.toLocaleString('he-IL')}</p>
                    : <p className="text-xs font-black text-blue-600">—</p>}
                  <p className="text-[10px] text-surface-400 mt-0.5">ממוצע ק"מ</p>
                </div>
                <div className="rounded-xl px-2 py-2 text-center" style={{ background: '#FFF7ED' }}>
                  <p className="text-xs font-black text-amber-600" dir="ltr">₪{marketPrice.prices.max.toLocaleString('he-IL')}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">מקסימום</p>
                </div>
              </div>
              {marketPrice.prices.count > 0 && (
                <p className="text-center text-[10px] text-surface-400 mt-2">מבוסס על {marketPrice.prices.count} מחירים</p>
              )}
            </div>
          )}

          {marketFetched && !marketPrice?.prices && (
            <p className="text-center text-sm text-surface-400 py-2 mt-2">לא נמצאו תוצאות ביד2</p>
          )}

          {marketPrice?._debug?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
              <p className="text-[10px] font-bold text-surface-400 mb-2">נתונים גולמיים ({marketPrice._debug.length} רכבים)</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {marketPrice._debug.map((item, i) => (
                  <div key={i} className="text-[10px] text-surface-500 px-2 py-1 rounded bg-surface-50 dark:bg-surface-700/50" dir="ltr">
                    {item.manufacturer} {item.model} {item.subModel} | {item.year} | ₪{item.price?.toLocaleString()} | {item.km?.toLocaleString()} km
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Last service ─────────────────────────────────────────────────────── */}
      <Section title="טיפול אחרון" icon={Wrench} iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-900/30" defaultOpen={true}>
        {lastService ? (
          <InfoRow
            icon={Wrench}
            iconColor="text-blue-500"
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            title={SERVICE_TYPES[lastService.serviceType] || lastService.serviceType}
            subtitle={formatDate(lastService.date)}
            extra={lastService.mileage && vehicle.currentMileage ? `לפני ${formatNumber(vehicle.currentMileage - lastService.mileage)} ק״מ` : lastService.mileage ? `${formatNumber(lastService.mileage)} ק״מ` : null}
            right={formatCurrency(Number(lastService.cost))}
          />
        ) : (
          <p className="px-4 py-4 text-sm text-surface-400 text-center">אין טיפולים רשומים</p>
        )}
      </Section>

      {/* ── Next service ─────────────────────────────────────────────────────── */}
      {lastService?.nextServiceMileage && (
        <Section title="טיפול הבא" icon={Wrench} iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-900/30" defaultOpen={true}>
          <InfoRow
            icon={Wrench}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            title="טיפול תקופתי"
            subtitle={`יעד: ${formatNumber(lastService.nextServiceMileage)} ק״מ`}
            right={`${formatNumber(lastService.nextServiceMileage)} ק״מ`}
          />
        </Section>
      )}

      {/* ── Test (MOT) ───────────────────────────────────────────────────────── */}
      <Section
        title="טסט שנתי"
        icon={ClipboardCheck}
        iconColor={testColor === 'red' ? 'text-red-500' : testColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}
        iconBg={testColor === 'red' ? 'bg-red-50 dark:bg-red-900/30' : testColor === 'amber' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}
        defaultOpen={true}
      >
        {testExpiry ? (
          <InfoRow
            icon={ClipboardCheck}
            iconColor={testColor === 'red' ? 'text-red-500' : testColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}
            iconBg={testColor === 'red' ? 'bg-red-50 dark:bg-red-900/30' : testColor === 'amber' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}
            title={testDaysLeft < 0 ? 'פג תוקף' : `בעוד ${testDaysLeft} ימים`}
            subtitle={formatDate(testExpiry)}
            urgentBorder={testDaysLeft < 0 || testDaysLeft <= 14}
          />
        ) : (
          <p className="px-4 py-4 text-sm text-surface-400 text-center">אין מידע על טסט</p>
        )}
      </Section>

      {/* ── Active reminders ─────────────────────────────────────────────────── */}
      <Section title="תזכורות פעילות" icon={Bell} iconColor="text-orange-500" iconBg="bg-orange-50 dark:bg-orange-900/30" count={vehicle.reminders?.filter(r => r.isActive).length} defaultOpen={true}>
        <RemindersSection vehicleId={vehicle.id} reminders={vehicle.reminders} onRefresh={fetchVehicle} />
      </Section>

      {/* ── Active insurances ────────────────────────────────────────────────── */}
      <Section title="ביטוחים פעילים" icon={Shield} iconColor="text-purple-500" iconBg="bg-purple-50 dark:bg-purple-900/30" defaultOpen={true}>
        <InsurancesSection vehicleId={vehicle.id} />
      </Section>

      {/* ── Services history ─────────────────────────────────────────────────── */}
      <Section title="היסטוריית טיפולים" icon={Wrench} iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-900/30" count={vehicle.services?.length} defaultOpen={false}>
        <ServicesSection vehicleId={vehicle.id} services={vehicle.services} onRefresh={fetchVehicle} />
      </Section>

      {/* ── Expenses ─────────────────────────────────────────────────────────── */}
      <Section title="הוצאות" icon={Receipt} iconColor="text-rose-500" iconBg="bg-rose-50 dark:bg-rose-900/30" count={vehicle.expenses?.length} defaultOpen={false}>
        <ExpensesSection vehicleId={vehicle.id} expenses={vehicle.expenses} onRefresh={fetchVehicle} />
      </Section>

      {/* ── Vehicle details ──────────────────────────────────────────────────── */}
      <Section title="פרטי הרכב" icon={FileText} iconColor="text-surface-500" iconBg="bg-surface-100 dark:bg-surface-700" defaultOpen={false}>
        <DetailsSection vehicle={vehicle} setVehicle={setVehicle} />
      </Section>

    </div>
  );
}

// ─── Reminders section ───────────────────────────────────────────────────────
function RemindersSection({ vehicleId, reminders, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const emptyForm = { reminderType: 'OIL', title: '', dueDate: '', dueMileage: '', intervalMonths: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd  = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (r) => {
    setForm({ reminderType: r.reminderType, title: r.title ?? '', dueDate: r.dueDate ? r.dueDate.split('T')[0] : '', dueMileage: r.dueMileage ?? '', intervalMonths: r.intervalMonths ?? '' });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { vehicleId, reminderType: form.reminderType, title: form.title, dueDate: form.dueDate || undefined, dueMileage: form.dueMileage ? Number(form.dueMileage) : undefined, intervalMonths: form.intervalMonths ? Number(form.intervalMonths) : undefined };
      if (editingId) await remindersApi.update(editingId, payload);
      else            await remindersApi.create(payload);
      setShowForm(false); setEditingId(null); onRefresh();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק תזכורת זו?')) return;
    setDeletingId(id);
    try { await remindersApi.delete(id); onRefresh(); }
    catch (err) { alert(err.message); } finally { setDeletingId(null); }
  };

  const active = (reminders || []).filter(r => r.isActive);

  const reminderIcon = (type) => {
    const map = { OIL: '🛢️', TEST: '📋', INSURANCE: '🛡️', TIRE: '🔄', BRAKE: '🔴', FILTER: '🌀', BATTERY: '🔋', OTHER: '🔔' };
    return map[type] || '🔔';
  };

  return (
    <div>
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-surface-100 dark:border-surface-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">סוג</label>
              <select value={form.reminderType} onChange={e => setForm({...form, reminderType: e.target.value})} className="input">
                {Object.entries(REMINDER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label">כותרת</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" placeholder="החלפת שמן" required /></div>
            <div><label className="label">תאריך יעד</label><input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="input" /></div>
            <div><label className="label">ק״מ יעד</label><input type="number" value={form.dueMileage} onChange={e => setForm({...form, dueMileage: e.target.value})} className="input" placeholder="150000" dir="ltr" /></div>
            <div><label className="label">חזרה (חודשים)</label><input type="number" value={form.intervalMonths} onChange={e => setForm({...form, intervalMonths: e.target.value})} className="input" placeholder="12" dir="ltr" /></div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 flex items-center justify-center gap-1"><X size={14}/>ביטול</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{editingId ? 'עדכן' : 'שמור'}
            </button>
          </div>
        </form>
      )}

      {active.length === 0 && !showForm && (
        <p className="px-4 py-4 text-sm text-surface-400 text-center">אין תזכורות פעילות</p>
      )}

      {active.map(r => {
        const overdue = r.dueDate && new Date(r.dueDate) < new Date();
        const daysLeft = r.dueDate ? Math.ceil((new Date(r.dueDate) - new Date()) / (1000*60*60*24)) : null;
        return (
          <InfoRow
            key={r.id}
            icon={Bell}
            iconColor={overdue ? 'text-red-500' : 'text-orange-500'}
            iconBg={overdue ? 'bg-red-50 dark:bg-red-900/30' : 'bg-orange-50 dark:bg-orange-900/30'}
            title={r.title}
            subtitle={REMINDER_TYPES[r.reminderType]}
            extra={daysLeft !== null ? (overdue ? `עבר לפני ${Math.abs(daysLeft)} ימים` : `בעוד ${daysLeft} ימים`) : null}
            right={r.dueDate ? formatDate(r.dueDate) : null}
            urgentBorder={overdue}
            onEdit={() => openEdit(r)}
            onDelete={() => handleDelete(r.id)}
            deleting={deletingId === r.id}
          />
        );
      })}

      <div className="px-4 py-3">
        <button onClick={openAdd} className="w-full flex items-center justify-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium py-2 border border-dashed border-brand-300 dark:border-brand-700 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
          <Plus size={13} />הוסף תזכורת
        </button>
      </div>
    </div>
  );
}

// ─── Insurances section ──────────────────────────────────────────────────────
const INSURANCE_TYPES = [
  { value: 'MANDATORY',     label: 'חובה' },
  { value: 'THIRD_PARTY',   label: "צד ג'" },
  { value: 'COMPREHENSIVE', label: 'מקיף' },
];

function InsurancesSection({ vehicleId }) {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const empty = { insuranceType: 'MANDATORY', company: '', startDate: '', endDate: '', cost: '', notes: '' };
  const [form, setForm] = useState(empty);

  const calcEndDate = (start) => {
    if (!start) return '';
    const d = new Date(start);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const load = useCallback(() => {
    setLoading(true);
    insurancesApi.list(vehicleId).then(r => setList(r.insurances)).catch(console.error).finally(() => setLoading(false));
  }, [vehicleId]);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(empty); setEditingId(null); setShowForm(true); };
  const openEdit = (ins) => {
    setForm({ insuranceType: ins.insuranceType, company: ins.company, startDate: ins.startDate?.toString().split('T')[0] || '', endDate: ins.endDate?.toString().split('T')[0] || '', cost: ins.cost ? String(ins.cost) : '', notes: ins.notes || '' });
    setEditingId(ins.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.company || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      const payload = { ...form, vehicleId, cost: form.cost ? Number(form.cost) : null };
      if (editingId) await insurancesApi.update(editingId, payload);
      else            await insurancesApi.create(payload);
      setShowForm(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await insurancesApi.delete(id); load(); }
    catch (e) { console.error(e); } finally { setDeletingId(null); }
  };

  const typeLabel = Object.fromEntries(INSURANCE_TYPES.map(t => [t.value, t.label]));
  const typeColor = { MANDATORY: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300', THIRD_PARTY: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300', COMPREHENSIVE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300' };
  const fmt = d => d ? new Date(d).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' }) : '—';
  const daysLeft = d => Math.ceil((new Date(d) - new Date()) / (1000*60*60*24));

  const active = list.filter(i => i.isActive);

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-brand-500" size={22} /></div>;

  return (
    <div>
      {showForm && (
        <div className="p-4 border-b border-surface-100 dark:border-surface-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">סוג ביטוח</label>
              <select className="input" value={form.insuranceType} onChange={e => setForm(f => ({...f, insuranceType: e.target.value}))}>
                {INSURANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="label">חברת ביטוח *</label><input className="input" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="מנורה, הפניקס..." /></div>
            <div><label className="label">תאריך תחילה *</label><input type="date" className="input" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value, endDate: calcEndDate(e.target.value)})) } /></div>
            <div><label className="label">תאריך סיום</label><input type="date" className="input" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} /></div>
            <div><label className="label">פרמיה שנתית (₪)</label><input type="number" className="input" value={form.cost} onChange={e => setForm(f => ({...f, cost: e.target.value}))} /></div>
            <div><label className="label">הערות</label><input className="input" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">ביטול</button>
            <button onClick={handleSave} disabled={saving || !form.company || !form.startDate || !form.endDate} className="btn-primary flex-1 flex items-center justify-center gap-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}שמור
            </button>
          </div>
        </div>
      )}

      {active.length === 0 && !showForm && (
        <p className="px-4 py-4 text-sm text-surface-400 text-center">אין ביטוחים פעילים</p>
      )}

      {active.map(ins => {
        const dl = daysLeft(ins.endDate);
        const urgent = dl <= 7;
        const warn   = dl <= 30;
        return (
          <InfoRow
            key={ins.id}
            icon={Shield}
            iconColor={ins.insuranceType === 'MANDATORY' ? 'text-blue-500' : ins.insuranceType === 'THIRD_PARTY' ? 'text-purple-500' : 'text-emerald-500'}
            iconBg={ins.insuranceType === 'MANDATORY' ? 'bg-blue-50 dark:bg-blue-900/30' : ins.insuranceType === 'THIRD_PARTY' ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}
            title={`ביטוח ${typeLabel[ins.insuranceType]} — ${ins.company}`}
            subtitle={`עד ${fmt(ins.endDate)}`}
            extra={warn ? (urgent ? `⚠️ פג בעוד ${dl} ימים` : `📅 בעוד ${dl} ימים`) : null}
            right={ins.cost ? `₪${Number(ins.cost).toLocaleString('he-IL')}` : null}
            urgentBorder={urgent}
            onEdit={() => openEdit(ins)}
            onDelete={() => handleDelete(ins.id)}
            deleting={deletingId === ins.id}
          />
        );
      })}

      <div className="px-4 py-3">
        <button onClick={openAdd} className="w-full flex items-center justify-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium py-2 border border-dashed border-brand-300 dark:border-brand-700 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
          <Plus size={13} />הוסף ביטוח
        </button>
      </div>
    </div>
  );
}

// ─── Services section ────────────────────────────────────────────────────────
const PAGE_SIZE = 5;

function ServicesSection({ vehicleId, services, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const emptyForm = { serviceType: 'PERIODIC', date: new Date().toISOString().split('T')[0], cost: '', mileage: '', nextServiceMileage: '', description: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd  = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({ serviceType: s.serviceType, date: s.date ? s.date.split('T')[0] : '', cost: s.cost ?? '', mileage: s.mileage ?? '', nextServiceMileage: s.nextServiceMileage ?? '', description: s.description ?? '' });
    setEditingId(s.id); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { vehicleId, serviceType: form.serviceType, date: form.date, cost: Number(form.cost), mileage: form.mileage ? Number(form.mileage) : undefined, nextServiceMileage: form.nextServiceMileage ? Number(form.nextServiceMileage) : undefined, description: form.description || undefined };
      if (editingId) await servicesApi.update(editingId, payload);
      else            await servicesApi.create(payload);
      setShowForm(false); setEditingId(null); onRefresh();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק טיפול זה?')) return;
    setDeletingId(id);
    try { await servicesApi.delete(id); onRefresh(); }
    catch (err) { alert(err.message); } finally { setDeletingId(null); }
  };

  return (
    <div>
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-surface-100 dark:border-surface-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">סוג טיפול</label>
              <select value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})} className="input">
                {Object.entries(SERVICE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label">תאריך</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input" required /></div>
            <div><label className="label">עלות (₪)</label><input type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="input" placeholder="0" required dir="ltr" /></div>
            <div><label className="label">קילומטראז׳</label><input type="number" value={form.mileage} onChange={e => setForm({...form, mileage: e.target.value})} className="input" placeholder="120000" dir="ltr" /></div>
            {form.serviceType === 'PERIODIC' && (
              <div className="col-span-2">
                <label className="label">ק״מ לטיפול הבא</label>
                <div className="flex gap-2 mb-2">
                  {[10000, 12000, 15000].map(interval => (
                    <button
                      key={interval}
                      type="button"
                      onClick={() => setForm({ ...form, nextServiceMileage: String((parseInt(form.mileage) || 0) + interval) })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.nextServiceMileage && parseInt(form.nextServiceMileage) === (parseInt(form.mileage) || 0) + interval
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-300 hover:border-brand-400 hover:text-brand-600'
                      }`}
                    >
                      +{(interval / 1000).toLocaleString('he-IL')}K ק״מ
                    </button>
                  ))}
                </div>
                <input type="number" value={form.nextServiceMileage} onChange={e => setForm({...form, nextServiceMileage: e.target.value})} className="input" placeholder="הזן ידנית..." dir="ltr" />
              </div>
            )}
          </div>
          <div><label className="label">הערות</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-[56px]" placeholder="פרטים נוספים..." /></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary flex-1 flex items-center justify-center gap-1"><X size={14}/>ביטול</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{editingId ? 'עדכן' : 'שמור'}
            </button>
          </div>
        </form>
      )}

      {services.length === 0 && !showForm && (
        <p className="px-4 py-4 text-sm text-surface-400 text-center">אין טיפולים רשומים</p>
      )}

      {services.slice(0, visibleCount).map(s => (
        <InfoRow
          key={s.id}
          icon={Wrench}
          iconColor="text-blue-500"
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          title={SERVICE_TYPES[s.serviceType] || s.serviceType}
          subtitle={formatDate(s.date)}
          extra={s.description || (s.mileage ? `${formatNumber(s.mileage)} ק״מ` : null)}
          right={formatCurrency(Number(s.cost))}
          rightSub={s.nextServiceMileage ? `הבא: ${formatNumber(s.nextServiceMileage)} ק״מ` : null}
          onEdit={() => openEdit(s)}
          onDelete={() => handleDelete(s.id)}
          deleting={deletingId === s.id}
        />
      ))}

      {services.length > visibleCount && (
        <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="w-full py-2.5 text-xs text-brand-600 font-medium border-t border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
          טען עוד ({services.length - visibleCount} נותרו)
        </button>
      )}

      <div className="px-4 py-3 border-t border-surface-50 dark:border-surface-700">
        <button onClick={openAdd} className="w-full flex items-center justify-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium py-2 border border-dashed border-brand-300 dark:border-brand-700 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
          <Plus size={13} />הוסף טיפול
        </button>
      </div>
    </div>
  );
}

// ─── Expenses section ────────────────────────────────────────────────────────
function ExpensesSection({ vehicleId, expenses, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const emptyForm = { category: 'FUEL', date: new Date().toISOString().split('T')[0], amount: '', description: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd  = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (e) => {
    setForm({ category: e.category, date: e.date ? e.date.split('T')[0] : '', amount: e.amount ?? '', description: e.description ?? '' });
    setEditingId(e.id); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { vehicleId, category: form.category, date: form.date, amount: Number(form.amount), description: form.description || undefined };
      if (editingId) await expensesApi.update(editingId, payload);
      else            await expensesApi.create(payload);
      setShowForm(false); setEditingId(null); onRefresh();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק הוצאה זו?')) return;
    setDeletingId(id);
    try { await expensesApi.delete(id); onRefresh(); }
    catch (err) { alert(err.message); } finally { setDeletingId(null); }
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      {expenses.length > 0 && (
        <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
          <p className="text-xs text-surface-400">סה״כ הוצאות</p>
          <p className="text-base font-bold text-brand-600">{formatCurrency(total)}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-surface-100 dark:border-surface-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">קטגוריה</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
                {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label">תאריך</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input" required /></div>
            <div><label className="label">סכום (₪)</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input" placeholder="0" required dir="ltr" /></div>
          </div>
          <div><label className="label">הערות</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-[56px]" placeholder="פרטים נוספים..." /></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary flex-1 flex items-center justify-center gap-1"><X size={14}/>ביטול</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{editingId ? 'עדכן' : 'שמור'}
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 && !showForm && (
        <p className="px-4 py-4 text-sm text-surface-400 text-center">אין הוצאות רשומות</p>
      )}

      {expenses.slice(0, visibleCount).map(e => (
        <InfoRow
          key={e.id}
          icon={Receipt}
          iconColor="text-rose-500"
          iconBg="bg-rose-50 dark:bg-rose-900/30"
          title={EXPENSE_CATEGORIES[e.category] || e.category}
          subtitle={formatDate(e.date)}
          extra={e.description || null}
          right={formatCurrency(Number(e.amount))}
          onEdit={() => openEdit(e)}
          onDelete={() => handleDelete(e.id)}
          deleting={deletingId === e.id}
        />
      ))}

      {expenses.length > visibleCount && (
        <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="w-full py-2.5 text-xs text-brand-600 font-medium border-t border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
          טען עוד ({expenses.length - visibleCount} נותרו)
        </button>
      )}

      <div className="px-4 py-3 border-t border-surface-50 dark:border-surface-700">
        <button onClick={openAdd} className="w-full flex items-center justify-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium py-2 border border-dashed border-brand-300 dark:border-brand-700 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
          <Plus size={13} />הוסף הוצאה
        </button>
      </div>
    </div>
  );
}

// ─── Details section ─────────────────────────────────────────────────────────
function DetailsSection({ vehicle, setVehicle }) {
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await vehiclesApi.refresh(vehicle.id);
      setVehicle(prev => ({ ...prev, ...res.vehicle }));
      showToast('success', 'נתוני הרכב עודכנו בהצלחה');
    } catch (err) { showToast('error', err.message || 'שגיאה בעדכון'); } finally { setRefreshing(false); }
  };

  const fmtDate = (yyyymm) => {
    if (!yyyymm) return '';
    const s = String(yyyymm);
    if (s.length === 6) return `${s.slice(4,6)}/${s.slice(0,4)}`;
    return s;
  };

  const fields = [
    ['לוחית רישוי', vehicle.licensePlate],
    ['יצרן', vehicle.manufacturer],
    ['דגם', vehicle.model],
    ['רמת גימור', vehicle.trim],
    ['שנת ייצור', vehicle.year],
    ['צבע', vehicle.color],
    ['דלק', vehicle.fuelType],
    ['מספר שלדה', vehicle.vin],
    ['מנוע', vehicle.engineModel],
    ['נפח מנוע', vehicle.engineCC ? `${vehicle.engineCC} סמ"ק` : null],
    ['כוח סוס', vehicle.horsePower ? `${vehicle.horsePower} כ"ס` : null],
    ['תיבת הילוכים', vehicle.transmission],
    ['הנעה', vehicle.driveType],
    ['תקן', vehicle.standardType],
    ['סוג מרכב', vehicle.bodyType],
    ['דלתות', vehicle.doors],
    ['מושבים', vehicle.seats],
    ['חלונות חשמל', vehicle.electricWindows],
    ['משקל כולל', vehicle.weight ? `${vehicle.weight} ק"ג` : null],
    ['כושר גרירה עם בלמים', vehicle.towingWithBrakes ? `${vehicle.towingWithBrakes} ק"ג` : null],
    ['כושר גרירה ללא בלמים', vehicle.towingWithoutBrakes ? `${vehicle.towingWithoutBrakes} ק"ג` : null],
    ['צמיג קדמי', vehicle.frontTire],
    ['צמיג אחורי', vehicle.rearTire],
    ['כריות אוויר', vehicle.airbags],
    ['בעלות', vehicle.ownership],
    ['מקור', vehicle.origin],
    ['עלייה לכביש', vehicle.firstRegistered ? fmtDate(vehicle.firstRegistered) : null],
    ['CO₂', vehicle.co2 ? `${vehicle.co2} גר/ק"מ` : null],
    ['CO₂ עיר', vehicle.co2City ? `${vehicle.co2City} גר/ק"מ` : null],
    ['CO₂ כביש מהיר', vehicle.co2Highway ? `${vehicle.co2Highway} גר/ק"מ` : null],
    ['NOx', vehicle.nox ? `${vehicle.nox} מ"ג/ק"מ` : null],
    ['ציון ירוק', vehicle.greenScore],
    ['ניקוד בטיחות', vehicle.safetyScore],
    ['דירוג בטיחות', vehicle.safetyRating],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  const boolFeatures = [
    ['ABS', vehicle.hasABS],
    ['יציבות אקטיבית (ESC)', vehicle.hasStabControl],
    ['הגה כוח', vehicle.hasPowerSteering],
    ['מיזוג אוויר', vehicle.hasAC],
    ['גג שמש', vehicle.hasSunroof],
    ['גלגלי סגסוגת', vehicle.hasAlloyWheels],
    ['מצלמת אחור', vehicle.hasRearCamera],
    ['חיישני לחץ צמיגים', vehicle.hasTirePressure],
    ['התראת עייפות', vehicle.hasFatigueAlert],
    ['התראת יציאת נתיב', vehicle.hasLaneDeparture],
    ['התראת מרחק קדמי', vehicle.hasForwardWarning],
    ['זיהוי שטח סמוי', vehicle.hasBlindSpot],
    ['שיוט אדפטיבי', vehicle.hasAdaptiveCruise],
    ['זיהוי הולכי רגל', vehicle.hasPedestrianDetect],
    ['בלימת חירום אוטומטית', vehicle.hasAutoEmergencyBrake],
    ['אורות גבוהים אוטומטיים', vehicle.hasAutoHighBeam],
    ['מגביל מהירות', vehicle.hasSpeedLimiter],
    ['נעילת אלכוהול', vehicle.hasAlcoLock],
  ];

  const inspectionFlags = [
    { label: 'שינוי מבנה', value: vehicle.structureChange },
    { label: 'גרפ"מ (נפגע קשה)', value: vehicle.hasGrapam },
    { label: 'שינוי צבע', value: vehicle.colorChange },
    { label: 'שינוי צמיגים', value: vehicle.tireChange },
  ];
  const hasAnyFlag = inspectionFlags.some(f => f.value);

  const recalls = vehicle.recalls || [];
  const ownershipHistory = vehicle.ownershipHistory || [];

  return (
    <div className="p-4 space-y-4">
      {/* Refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-surface-400">
          {vehicle.govDataUpdatedAt
            ? `עודכן: ${new Date(vehicle.govDataUpdatedAt).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' })}`
            : 'נתוני ממשלה לא עודכנו עדיין'}
        </p>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50 transition-colors">
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'מעדכן...' : 'רענן נתונים'}
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✗'}</span>{toast.msg}
        </div>
      )}

      {/* Recalls */}
      {recalls.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <p className="font-bold text-red-600 dark:text-red-400 text-sm mb-2">⚠️ ריקול פתוח ({recalls.length})</p>
          {recalls.map((rc, i) => (
            <div key={i} className="text-xs border-t border-red-100 dark:border-red-800 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
              <p className="font-semibold text-red-700 dark:text-red-300">{rc.system}</p>
              <p className="text-red-500 mt-0.5">{rc.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-surface-400 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-surface-800 dark:text-surface-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Test / inspection flags */}
      {(vehicle.testKm || hasAnyFlag) && (
        <div className="bg-surface-50 dark:bg-surface-700/40 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">נתוני טסט ובדיקה</p>
          {vehicle.testKm > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500">ק"מ בטסט האחרון</span>
              <span className="text-xs font-medium text-surface-800 dark:text-surface-100">{vehicle.testKm.toLocaleString('he-IL')} ק"מ</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {inspectionFlags.map(f => (
              <div key={f.label} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${f.value ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'text-surface-400'}`}>
                <span className="font-bold">{f.value ? '⚠' : '✓'}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety features */}
      <div>
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">ציוד ובטיחות</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {boolFeatures.map(([label, val]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`text-xs font-bold w-4 text-center ${val ? 'text-emerald-500' : 'text-surface-300 dark:text-surface-600'}`}>{val ? '✓' : '✗'}</span>
              <span className={`text-xs ${val ? 'text-surface-700 dark:text-surface-200' : 'text-surface-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ownership history */}
      {ownershipHistory.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-2">היסטוריית בעלות</p>
          <div className="space-y-1">
            {ownershipHistory.map((o, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-surface-100 dark:border-surface-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                  <span className="text-xs font-medium">{o.type}</span>
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

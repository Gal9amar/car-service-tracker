import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboard, expenses as expensesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, AlertTriangle, Bell, TrendingUp } from 'lucide-react';
import { formatDate, formatNumber, SERVICE_TYPES, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_ICONS } from '../utils/constants';

function testStatus(testExpiry) {
  if (!testExpiry) return null;
  const d = new Date(testExpiry);
  const now = new Date();
  if (d < now) return 'expired';
  if (d < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) return 'soon';
  return 'ok';
}

const HERO_GRADIENT = 'linear-gradient(145deg, #003D82 0%, #0066CC 55%, #00B4A0 100%)';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [annualYear, setAnnualYear] = useState(currentYear);
  const [annualData, setAnnualData] = useState(null);
  const [annualLoading, setAnnualLoading] = useState(true);

  useEffect(() => {
    dashboard.get()
      .then(res => setData(res.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setAnnualLoading(true);
    expensesApi.annual(annualYear)
      .then(res => setAnnualData(res.annual))
      .catch(console.error)
      .finally(() => setAnnualLoading(false));
  }, [annualYear]);

  if (loading) {
    return (
      <div dir="rtl">
        <div className="-mx-4 -mt-6 flex items-center justify-center" style={{ background: HERO_GRADIENT, height: 200 }}>
          <div className="w-9 h-9 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-center text-surface-500 mt-10">שגיאה בטעינת הנתונים</p>;

  const overdueCount = data.overdueReminders?.length || 0;
  const upcomingCount = data.upcomingReminders?.length || 0;
  const totalServices = data.vehicles.reduce((s, v) => s + (v.serviceCount || 0), 0);

  const todayStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fade-in" dir="rtl">

      {/* ── BYD Hero gradient ── */}
      <div className="-mx-4 -mt-6 px-5 pt-6 pb-14" style={{ background: HERO_GRADIENT }}>
        {/* Greeting row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-white/65 text-sm mb-0.5">{todayStr}</p>
            <h1 className="text-2xl font-black text-white leading-tight">{user?.name} 👋</h1>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-white/30"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }}
          >
            {user?.name?.[0] || 'א'}
          </div>
        </div>

        {/* Stats chips */}
        <div className="flex gap-2.5">
          <div className="rounded-xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(10px)' }}>
            <p className="text-lg font-black text-white leading-none">{data.vehicles.length}</p>
            <p className="text-[10px] text-white/60 mt-0.5">רכבים</p>
          </div>
          <div className="rounded-xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(10px)' }}>
            <p className="text-lg font-black text-white leading-none">{totalServices}</p>
            <p className="text-[10px] text-white/60 mt-0.5">טיפולים</p>
          </div>
          {(overdueCount + upcomingCount) > 0 && (
            <div className="rounded-xl px-4 py-2.5" style={{ background: 'rgba(255,180,0,0.22)', border: '1px solid rgba(255,180,0,0.35)', backdropFilter: 'blur(10px)' }}>
              <p className="text-lg font-black text-amber-200 leading-none">{overdueCount + upcomingCount}</p>
              <p className="text-[10px] text-amber-200/70 mt-0.5">התראות</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating alert strip ── */}
      {(overdueCount > 0 || upcomingCount > 0) && (
        <div className="-mt-6 mx-1 mb-4 space-y-2 relative z-10">
          {overdueCount > 0 && (
            <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border-r-4 border-red-500" style={{ boxShadow: '0 4px 16px rgba(239,68,68,0.15)' }}>
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-600">{overdueCount} תזכורות באיחור</p>
                <p className="text-xs text-surface-400">דורשות טיפול מיידי</p>
              </div>
              <Link to="/vehicles" className="text-xs font-semibold text-red-500 hover:text-red-700">פרטים</Link>
            </div>
          )}
          {upcomingCount > 0 && (
            <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border-r-4 border-amber-400" style={{ boxShadow: '0 4px 16px rgba(245,158,11,0.12)' }}>
              <Bell size={18} className="text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-700">{upcomingCount} תזכורות קרובות</p>
                <p className="text-xs text-surface-400">בשבועות הקרובים</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Overdue reminder rows ── */}
      {overdueCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-bold text-surface-900 dark:text-white text-sm flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-red-500" /> תזכורות באיחור
            </h2>
          </div>
          <div className="space-y-2">
            {data.overdueReminders.map(r => (
              <Link key={r.id} to={`/vehicles/${r.vehicle.id}`}
                className="flex items-center justify-between bg-white dark:bg-surface-800 rounded-2xl px-4 py-3 border-r-4 border-red-400 hover:shadow-md transition-all"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div>
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{r.title}</p>
                  <p className="text-xs text-surface-400">{r.vehicle.manufacturer} {r.vehicle.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-lg">{formatDate(r.dueDate)}</span>
                  <ChevronLeft size={14} className="text-surface-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Vehicles ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-surface-900 dark:text-white">הרכבים שלי</h2>
          <Link to="/vehicles" className="text-xs text-brand-600 font-semibold flex items-center gap-0.5 hover:text-brand-800">
            הכל <ChevronLeft size={13} />
          </Link>
        </div>

        {data.vehicles.length === 0 ? (
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-4xl mb-3">🚗</p>
            <p className="text-surface-500 text-sm mb-4">עדיין לא הוספת רכבים</p>
            <Link to="/vehicles/new" className="btn-primary inline-flex items-center gap-2 text-sm">הוסף רכב ראשון</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        )}
      </div>

      {/* ── Annual Expenses KPI ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp size={15} className="text-brand-500" /> הוצאות שנתיות
          </h2>
          <div dir="ltr" className="flex items-center rounded-xl overflow-hidden" style={{ background: '#F0F4F8', border: '1px solid #D1DCE8' }}>
            <button
              onClick={() => setAnnualYear(y => y - 1)}
              className="w-7 h-7 flex items-center justify-center text-surface-500 hover:text-brand-600 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-bold text-surface-800 px-2 min-w-[44px] text-center">{annualYear}</span>
            <button
              onClick={() => setAnnualYear(y => y + 1)}
              disabled={annualYear >= currentYear}
              className="w-7 h-7 flex items-center justify-center text-surface-500 hover:text-brand-600 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' }} />
          {annualLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-7 h-7 border-[3px] border-surface-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : annualData ? (
            <div className="p-4">
              {/* Total */}
              <div className="text-center pb-3 border-b border-surface-100 dark:border-surface-700 mb-3">
                <p className="text-[11px] text-surface-400 mb-0.5">סה"כ הוצאות {annualYear}</p>
                <p className="text-3xl font-black" style={{ color: annualData.total > 0 ? '#0066CC' : '#A0B4C8' }} dir="ltr">
                  ₪{annualData.total.toLocaleString('he-IL')}
                </p>
                {annualData.total > 0 && (
                  <p className="text-[11px] text-surface-400 mt-0.5">ממוצע חודשי: ₪{Math.round(annualData.total / 12).toLocaleString('he-IL')}</p>
                )}
              </div>

              {/* Expenses vs Services */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: '#F0F4F8' }}>
                  <p className="text-base font-black text-surface-700 dark:text-surface-300" dir="ltr">₪{annualData.expenses.toLocaleString('he-IL')}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">הוצאות</p>
                </div>
                <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: '#EFF7FF' }}>
                  <p className="text-base font-black" style={{ color: '#0066CC' }} dir="ltr">₪{annualData.services.toLocaleString('he-IL')}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">טיפולים</p>
                </div>
              </div>

              {/* Category breakdown */}
              {annualData.byCategory.length > 0 ? (
                <div className="space-y-2.5 mb-3">
                  {annualData.byCategory.slice(0, 4).map(c => {
                    const pct = annualData.expenses > 0 ? Math.round((c.amount / annualData.expenses) * 100) : 0;
                    return (
                      <div key={c.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-surface-600 dark:text-surface-400">
                            {EXPENSE_CATEGORY_ICONS[c.category]} {EXPENSE_CATEGORIES[c.category]}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-surface-400">{pct}%</span>
                            <span className="text-xs font-bold text-surface-800 dark:text-surface-200" dir="ltr">₪{c.amount.toLocaleString('he-IL')}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-100 dark:bg-surface-700">
                          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : annualData.total === 0 ? (
                <p className="text-center text-sm text-surface-400 py-2">אין נתונים ב-{annualYear}</p>
              ) : null}

              {/* Services list */}
              {annualData.servicesList?.length > 0 && (
                <div className="border-t border-surface-100 dark:border-surface-700 pt-3">
                  <p className="text-[11px] font-bold text-surface-500 dark:text-surface-400 mb-2">טיפולים</p>
                  <div className="space-y-2">
                    {annualData.servicesList.map(s => {
                      const typeName = SERVICE_TYPES.find(t => t.value === s.serviceType)?.label ?? s.serviceType;
                      return (
                        <div key={s.id} className="py-2 px-3 rounded-xl" style={{ background: '#F7FAFF' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-surface-500">מספר רכב: <span className="font-black text-surface-700 font-mono" dir="ltr">{s.licensePlate}</span></span>
                            <span className="text-[11px] text-surface-400">תאריך: {formatDate(s.date)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-surface-700">{typeName}</span>
                            <span className="text-xs font-black" style={{ color: '#0066CC' }} dir="ltr">
                              {s.cost > 0 ? `₪${s.cost.toLocaleString('he-IL')}` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expenses list */}
              {annualData.expensesList?.length > 0 && (
                <div className="border-t border-surface-100 dark:border-surface-700 pt-3 mt-3">
                  <p className="text-[11px] font-bold text-surface-500 dark:text-surface-400 mb-2">הוצאות</p>
                  <div className="space-y-2">
                    {annualData.expensesList.map(e => {
                      const catName = EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label ?? e.category;
                      return (
                        <div key={e.id} className="py-2 px-3 rounded-xl" style={{ background: '#F7FAFF' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-surface-500">מספר רכב: <span className="font-black text-surface-700 font-mono" dir="ltr">{e.licensePlate}</span></span>
                            <span className="text-[11px] text-surface-400">תאריך: {formatDate(e.date)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-surface-700">{catName}</span>
                            <span className="text-xs font-black text-surface-800" dir="ltr">₪{e.amount.toLocaleString('he-IL')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Upcoming reminders ── */}
      {upcomingCount > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-surface-900 dark:text-white mb-3">תזכורות קרובות</h2>
          <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden divide-y divide-surface-100 dark:divide-surface-700/50" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {data.upcomingReminders.slice(0, 4).map(r => (
              <Link key={r.id} to={`/vehicles/${r.vehicle.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Bell size={15} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{r.title}</p>
                    <p className="text-xs text-surface-400">{r.vehicle.manufacturer} {r.vehicle.model}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-xl whitespace-nowrap">
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


function IsraeliPlate({ number, compact }) {
  const fmt = (n) => {
    const d = (n || '').replace(/[^0-9]/g, '');
    if (d.length === 7) return `${d.slice(0,2)}-${d.slice(2,5)}-${d.slice(5)}`;
    if (d.length === 8) return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;
    return n;
  };
  if (compact) {
    return (
      <div style={{ display:'inline-flex', alignItems:'stretch', borderRadius:'5px', border:'2px solid #1a1a1a', overflow:'hidden', height:'30px', boxShadow:'0 1px 4px rgba(0,0,0,0.15)', direction:'ltr', flexShrink:0 }}>
        <div style={{ background:'#003399', width:'22px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px', padding:'2px 1px', flexShrink:0 }}>
          <span style={{ fontSize:'8px', lineHeight:1 }}>🇮🇱</span>
          <span style={{ color:'white', fontSize:'5.5px', fontWeight:800, lineHeight:1 }}>IL</span>
        </div>
        <div style={{ background:'#F5C400', padding:'0 8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:'13px', fontWeight:900, color:'#1a1a1a', letterSpacing:'1px', fontFamily:'monospace', whiteSpace:'nowrap' }}>
            {fmt(number)}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display:'inline-flex', alignItems:'stretch', borderRadius:'7px', border:'3px solid #1a1a1a', overflow:'hidden', height:'44px', boxShadow:'0 2px 8px rgba(0,0,0,0.18)', direction:'ltr' }}>
      <div style={{ background:'#003399', width:'34px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px', padding:'3px 2px', flexShrink:0 }}>
        <span style={{ fontSize:'11px', lineHeight:1 }}>🇮🇱</span>
        <span style={{ color:'white', fontSize:'8px', fontWeight:800, lineHeight:1 }}>IL</span>
        <span style={{ color:'white', fontSize:'6px', lineHeight:1 }}>ישראל</span>
      </div>
      <div style={{ background:'#F5C400', padding:'0 14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:'20px', fontWeight:900, color:'#1a1a1a', letterSpacing:'2px', fontFamily:'monospace', whiteSpace:'nowrap' }}>
          {fmt(number)}
        </span>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle }) {
  const status = testStatus(vehicle.testExpiry);
  const nextMileage = vehicle.nextServiceMileage ?? vehicle.lastService?.nextServiceMileage;
  const isOverdue = vehicle.currentMileage && nextMileage && nextMileage <= vehicle.currentMileage;

  const testChipStyle = {
    expired: { bg: '#FEE2E2', color: '#DC2626' },
    soon:    { bg: '#FEF3C7', color: '#D97706' },
    ok:      { bg: '#DCFCE7', color: '#16A34A' },
  }[status] || { bg: '#F0F4F8', color: '#7896B0' };

  return (
    <Link to={`/vehicles/${vehicle.id}`}
      className="block bg-white dark:bg-surface-800 rounded-2xl overflow-hidden hover:shadow-md transition-all group"
      style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>

      {/* BYD color band */}
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' }} />

      <div className="px-4 py-3">
        {/* Top: car info + compact plate + arrow */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#EFF7FF' }}>
              🚗
            </div>
            <div>
              <p className="font-bold text-surface-900 dark:text-white text-sm leading-tight">
                {vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}
              </p>
              <p className="text-xs text-surface-400">{vehicle.year}{vehicle.fuelType ? ` · ${vehicle.fuelType}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IsraeliPlate number={vehicle.licensePlate} compact />
            <ChevronLeft size={16} className="text-surface-300 group-hover:text-brand-500 transition-colors shrink-0" />
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl px-3 py-2 text-center" style={{ background: '#F0F4F8' }}>
            <p className="text-sm font-black text-brand-600">
              {vehicle.currentMileage ? formatNumber(vehicle.currentMileage) : '—'}
            </p>
            <p className="text-[10px] text-surface-400 mt-0.5">ק"מ</p>
          </div>

          {nextMileage ? (
            <div className="rounded-xl px-3 py-2 text-center" style={{ background: isOverdue ? '#FEE2E2' : '#EFF7FF' }}>
              <p className="text-sm font-black" style={{ color: isOverdue ? '#DC2626' : '#0066CC' }}>
                {formatNumber(nextMileage)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: isOverdue ? '#DC2626' : '#4AA3F8' }}>
                {isOverdue ? '⚠ הגיע!' : 'טיפול הבא'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl px-3 py-2 text-center" style={{ background: '#F0F4F8' }}>
              <p className="text-sm font-black text-surface-400">—</p>
              <p className="text-[10px] text-surface-400 mt-0.5">טיפול הבא</p>
            </div>
          )}

          <div className="rounded-xl px-3 py-2 text-center" style={{ background: testChipStyle.bg }}>
            <p className="text-sm font-black leading-tight" style={{ color: testChipStyle.color }}>
              {vehicle.testExpiry ? formatDate(vehicle.testExpiry) : '—'}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: testChipStyle.color, opacity: 0.7 }}>טסט</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

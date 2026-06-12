import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicles } from '../services/api';
import { Search, Car, Check, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

const BYD_BAND  = { background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' };
const BTN_STYLE = { background: 'linear-gradient(135deg, #0066CC 0%, #00B4A0 100%)', boxShadow: '0 4px 14px rgba(0,102,204,0.35)' };

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const [plate, setPlate]                 = useState('');
  const [lookupData, setLookupData]       = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError]     = useState('');
  const [saving, setSaving]               = useState(false);
  const [nickname, setNickname]           = useState('');
  const [mileage, setMileage]             = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError(''); setLookupData(null); setLookupLoading(true);
    try {
      const res = await vehicles.lookup(plate.replace(/[-\s]/g, ''));
      setLookupData(res.vehicle);
    } catch {
      setLookupError('הרכב לא נמצא במאגר. בדוק את מספר הרכב ונסה שוב.');
    } finally { setLookupLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...lookupData, nickname: nickname || undefined, currentMileage: mileage ? Number(mileage) : undefined };
      delete data._raw; delete data.ownershipHistory; delete data.recalls; delete data.wltp;
      const res = await vehicles.create(data);
      navigate(`/vehicles/${res.vehicle.id}`);
    } catch (err) { setLookupError(err.message || 'שגיאה בשמירה'); }
    finally { setSaving(false); }
  };

  const fmtDate = (yyyymm) => {
    if (!yyyymm) return '';
    const s = String(yyyymm);
    if (s.length === 6) return `${s.slice(4,6)}/${s.slice(0,4)}`;
    return s;
  };

  const v = lookupData;

  return (
    <div className="space-y-4 fade-in" dir="rtl">
      <div className="pt-1">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">הוסף רכב חדש</h1>
        <p className="text-surface-400 text-sm mt-0.5">הזן מספר רכב ונמצא את כל הפרטים אוטומטית</p>
      </div>

      {/* Search card */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
        <div className="h-1.5" style={BYD_BAND} />
        <div className="p-5">
          <form onSubmit={handleLookup} className="flex gap-3">
            <div className="flex-1 relative">
              <Car className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
              <input type="text" value={plate} onChange={e => setPlate(e.target.value)}
                className="input pr-11 text-lg font-mono tracking-wider" placeholder="מספר רכב (לדוגמה: 1234567)"
                dir="ltr" required />
            </div>
            <button type="submit" disabled={lookupLoading || !plate.trim()}
              className="flex items-center gap-2 whitespace-nowrap text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              style={BTN_STYLE}>
              {lookupLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              חפש
            </button>
          </form>
          {lookupError && (
            <p className="text-red-500 text-sm mt-3 flex items-center gap-1.5">
              <AlertTriangle size={14} className="shrink-0" />{lookupError}
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      {v && (
        <div className="space-y-3 slide-up">

          {/* Recall warning */}
          {v.hasActiveRecall && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <ShieldAlert size={20} />
                <span className="font-bold">⚠️ קריאות שירות פתוחות ({v.recalls.length})</span>
              </div>
              {v.recalls.map((rc, i) => (
                <div key={i} className="text-sm text-red-700 dark:text-red-300 mt-1">
                  <span className="font-medium">{rc.system}</span> — {rc.description?.slice(0,100)}{rc.description?.length > 100 ? '...' : ''}
                </div>
              ))}
            </div>
          )}

          {/* Change alerts */}
          {(v.structureChange || v.colorChange || v.tireChange || v.hasGrapam) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                <AlertTriangle size={18} />
                <span className="font-bold">שינויים שדווחו</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {v.structureChange && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg">שינוי מבנה</span>}
                {v.colorChange     && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg">שינוי צבע</span>}
                {v.tireChange      && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg">שינוי צמיגים</span>}
                {v.hasGrapam       && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded-lg">גרפ"מ</span>}
              </div>
            </div>
          )}

          {/* Main info card */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
            <div className="h-1.5" style={BYD_BAND} />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#DCFCE7' }}>
                  <Check size={16} className="text-emerald-600" />
                </div>
                <h2 className="font-bold text-surface-900 dark:text-white">רכב נמצא — {v.manufacturer} {v.model}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="שנת ייצור" value={v.year} />
                <InfoField label="צבע" value={v.color} />
                <InfoField label="סוג דלק" value={v.fuelType} />
                <InfoField label="דגם מנוע" value={v.engineModel} />
                <InfoField label="רמת גימור" value={v.trim} />
                <InfoField label="מספר שלדה" value={v.vin} dir="ltr" />
                <InfoField label="צמיג קדמי" value={v.frontTire} dir="ltr" />
                <InfoField label="צמיג אחורי" value={v.rearTire} dir="ltr" />
                <InfoField label="טסט אחרון" value={v.lastTest} />
                <InfoField label="תוקף רישוי" value={v.testExpiry} />
                <InfoField label="עלייה לכביש" value={v.firstRegistered} />
                <InfoField label="בעלות נוכחית" value={v.ownership} />
                {v.pollutionLevel && <InfoField label="רמת זיהום" value={`קבוצה ${v.pollutionLevel}`} />}
                {v.engineNumber   && <InfoField label="מספר מנוע" value={v.engineNumber} dir="ltr" />}
                {v.origin         && <InfoField label="מקוריות" value={v.origin} />}
              </div>
            </div>
          </div>

          {/* Test KM */}
          {v.testKm && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
              <div className="h-1.5" style={BYD_BAND} />
              <div className="p-5">
                <h3 className="font-bold mb-2 text-surface-900 dark:text-white">ק"מ בטסט האחרון</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black" style={{ color: '#0066CC' }}>{v.testKm.toLocaleString('he-IL')}</span>
                  <span className="text-surface-500 text-sm">ק"מ</span>
                </div>
                <p className="text-xs text-surface-400 mt-1">נרשם ע"י מכון הרישוי בבדיקה האחרונה</p>
              </div>
            </div>
          )}

          {/* Ownership history */}
          {v.ownershipHistory?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
              <div className="h-1.5" style={BYD_BAND} />
              <div className="p-5">
                <h3 className="font-bold mb-3 text-surface-900 dark:text-white">היסטוריית בעלות</h3>
                <div className="space-y-2">
                  {v.ownershipHistory.map((o, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-700 last:border-0">
                      <span className="text-sm font-medium">{o.type}</span>
                      <span className="text-xs text-surface-400 font-mono">{fmtDate(o.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* WLTP */}
          {v.wltp && (v.wltp.co2 || v.wltp.horsePower || v.wltp.engineCC) && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
              <div className="h-1.5" style={BYD_BAND} />
              <div className="p-5">
                <h3 className="font-bold mb-3 text-surface-900 dark:text-white">נתוני WLTP</h3>
                <div className="grid grid-cols-3 gap-3">
                  {v.wltp.horsePower      && <InfoField label="כוח סוס" value={`${v.wltp.horsePower} כ"ס`} />}
                  {v.wltp.engineCC        && <InfoField label="נפח מנוע" value={`${v.wltp.engineCC} סמ"ק`} />}
                  {v.wltp.co2             && <InfoField label="CO₂" value={`${v.wltp.co2} גר/ק"מ`} />}
                  {v.wltp.fuelConsumption && <InfoField label="צריכת דלק" value={`${v.wltp.fuelConsumption} ל/100ק"מ`} />}
                </div>
              </div>
            </div>
          )}

          {/* Additional input */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #00B4A0 0%, #0066CC 100%)' }} />
            <div className="p-5 space-y-4">
              <h3 className="font-semibold text-surface-700 dark:text-surface-300">פרטים נוספים (אופציונלי)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">כינוי לרכב</label>
                  <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                    className="input" placeholder='לדוגמה: "הרכב של אבא"' />
                </div>
                <div>
                  <label className="label">קילומטראז׳ נוכחי</label>
                  <input type="number" value={mileage} onChange={e => setMileage(e.target.value)}
                    className="input" placeholder="120000" dir="ltr" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pb-4">
            <button onClick={() => { setLookupData(null); setPlate(''); }} className="btn-secondary flex-1">ביטול</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-60"
              style={BTN_STYLE}>
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              שמור רכב
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value, dir }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs text-surface-400 mb-0.5">{label}</p>
      <p className="font-medium text-sm text-surface-800 dark:text-surface-100" dir={dir}>{value}</p>
    </div>
  );
}

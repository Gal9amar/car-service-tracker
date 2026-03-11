import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicles } from '../services/api';
import { Search, Car, Check, Loader2, ArrowRight } from 'lucide-react';

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const [plate, setPlate] = useState('');
  const [lookupData, setLookupData] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [saving, setSaving] = useState(false);
  const [nickname, setNickname] = useState('');
  const [mileage, setMileage] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError('');
    setLookupData(null);
    setLookupLoading(true);
    try {
      const res = await vehicles.lookup(plate.replace(/[-\s]/g, ''));
      setLookupData(res.vehicle);
    } catch (err) {
      setLookupError('הרכב לא נמצא במאגר. בדוק את מספר הרכב ונסה שוב.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...lookupData,
        nickname: nickname || undefined,
        currentMileage: mileage ? Number(mileage) : undefined,
      };
      delete data._raw;
      delete data.ownership;
      const res = await vehicles.create(data);
      navigate(`/vehicles/${res.vehicle.id}`);
    } catch (err) {
      setLookupError(err.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">הוסף רכב חדש</h1>
        <p className="text-surface-500 text-sm mt-1">הזן מספר רכב ונמצא את כל הפרטים אוטומטית</p>
      </div>

      {/* License plate input */}
      <div className="card p-6">
        <form onSubmit={handleLookup} className="flex gap-3">
          <div className="flex-1 relative">
            <Car className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="input pr-11 text-lg font-mono tracking-wider"
              placeholder="מספר רכב (לדוגמה: 1234567)"
              dir="ltr"
              required
            />
          </div>
          <button type="submit" disabled={lookupLoading || !plate.trim()} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            {lookupLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            חפש
          </button>
        </form>

        {lookupError && (
          <p className="text-red-500 text-sm mt-3">{lookupError}</p>
        )}
      </div>

      {/* Results */}
      {lookupData && (
        <div className="card p-6 slide-up space-y-6">
          <div className="flex items-center gap-3 text-emerald-600">
            <Check className="w-6 h-6" />
            <h2 className="font-bold text-lg">רכב נמצא!</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoField label="יצרן" value={lookupData.manufacturer} />
            <InfoField label="דגם" value={lookupData.model} />
            <InfoField label="שנת ייצור" value={lookupData.year} />
            <InfoField label="צבע" value={lookupData.color} />
            <InfoField label="סוג דלק" value={lookupData.fuelType} />
            <InfoField label="דגם מנוע" value={lookupData.engineModel} />
            <InfoField label="רמת גימור" value={lookupData.trim} />
            <InfoField label="מספר שלדה" value={lookupData.vin} dir="ltr" />
            <InfoField label="צמיג קדמי" value={lookupData.frontTire} dir="ltr" />
            <InfoField label="צמיג אחורי" value={lookupData.rearTire} dir="ltr" />
            <InfoField label="טסט אחרון" value={lookupData.lastTest} />
            <InfoField label="תוקף רישוי" value={lookupData.testExpiry} />
            <InfoField label="עלייה לכביש" value={lookupData.firstRegistered} />
            <InfoField label="בעלות" value={lookupData.ownership} />
          </div>

          {/* Additional user input */}
          <div className="border-t border-surface-200 dark:border-surface-700 pt-4 space-y-4">
            <h3 className="font-medium text-surface-600 dark:text-surface-400">פרטים נוספים (אופציונלי)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">כינוי לרכב</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="input"
                  placeholder='לדוגמה: "הרכב של אבא"'
                />
              </div>
              <div>
                <label className="label">קילומטראז׳ נוכחי</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="input"
                  placeholder="120000"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setLookupData(null); setPlate(''); }} className="btn-secondary">
              ביטול
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
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
  return (
    <div>
      <p className="text-xs text-surface-500 mb-0.5">{label}</p>
      <p className="font-medium" dir={dir}>{value || '-'}</p>
    </div>
  );
}

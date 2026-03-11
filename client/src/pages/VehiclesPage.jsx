import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vehicles as vehiclesApi } from '../services/api';
import { Plus, ChevronLeft } from 'lucide-react';
import { formatDate } from '../utils/constants';

function testStatus(testExpiry) {
  if (!testExpiry) return null;
  const d = new Date(testExpiry);
  if (d < new Date()) return 'expired';
  if (d < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) return 'soon';
  return 'ok';
}

function IsraeliPlate({ number }) {
  const fmt = (n) => {
    const d = (n || '').replace(/[^0-9]/g, '');
    if (d.length === 7) return `${d.slice(0,2)}-${d.slice(2,5)}-${d.slice(5)}`;
    if (d.length === 8) return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;
    return n;
  };
  return (
    <div style={{ display:'inline-flex', alignItems:'stretch', borderRadius:'7px', border:'3px solid #1a1a1a', overflow:'hidden', height:'46px', boxShadow:'0 2px 8px rgba(0,0,0,0.3)', direction:'ltr' }}>
      <div style={{ background:'#003399', width:'36px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px', padding:'3px 2px', flexShrink:0 }}>
        <span style={{ fontSize:'12px', lineHeight:1 }}>🇮🇱</span>
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

export default function VehiclesPage() {
  const [vehicleList, setVehicleList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehiclesApi.list()
      .then(res => setVehicleList(res.vehicles))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 fade-in" dir="rtl">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">הרכבים שלי</h1>
        <Link to="/vehicles/new"
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-md shadow-brand-500/25 transition-all active:scale-95">
          <Plus size={16} /> הוסף רכב
        </Link>
      </div>

      {vehicleList.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4">🚗</p>
          <p className="text-surface-500 mb-5">עדיין לא הוספת רכבים</p>
          <Link to="/vehicles/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> הוסף רכב ראשון
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicleList.map(v => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      )}
    </div>
  );
}

function VehicleCard({ vehicle }) {
  const status = testStatus(vehicle.testExpiry);
  const testBadgeStyle = {
    expired: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    soon:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ok:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <Link to={`/vehicles/${vehicle.id}`}
      className="block bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl px-5 py-4 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-sm transition-all group">

      {/* Top: make/model + arrow */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-2xl shrink-0">
            {vehicle.imageUrl
              ? <img src={vehicle.imageUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
              : '🚗'}
          </div>
          <div>
            <p className="font-bold text-surface-900 dark:text-white leading-tight">
              {vehicle.manufacturer} {vehicle.model}
            </p>
            {vehicle.nickname && (
              <p className="text-xs text-surface-400">{vehicle.nickname}</p>
            )}
          </div>
        </div>
        <ChevronLeft size={18} className="text-surface-300 group-hover:text-brand-500 transition-colors shrink-0" />
      </div>

      {/* Israeli plate */}
      <div className="flex justify-center mb-4">
        <IsraeliPlate number={vehicle.licensePlate} />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-surface-400 mb-0.5">שנת ייצור</p>
          <p className="text-sm font-bold text-surface-800 dark:text-white">{vehicle.year}</p>
        </div>

        <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-surface-400 mb-0.5">טיפולים</p>
          <p className="text-sm font-bold text-surface-800 dark:text-white">{vehicle._count?.services ?? 0}</p>
        </div>

        <div className={`rounded-xl px-3 py-2.5 ${status ? testBadgeStyle[status] : 'bg-surface-50 dark:bg-surface-700/50'}`}>
          <p className="text-xs opacity-60 mb-0.5">טסט</p>
          <p className="text-sm font-bold leading-tight">
            {vehicle.testExpiry ? formatDate(vehicle.testExpiry) : '—'}
          </p>
        </div>
      </div>

      {/* Optional extra info */}
      {(vehicle.currentMileage || vehicle.fuelType) && (
        <div className="flex gap-3 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
          {vehicle.currentMileage && (
            <span className="text-xs text-surface-400">🛣️ {vehicle.currentMileage.toLocaleString('he-IL')} ק״מ</span>
          )}
          {vehicle.fuelType && (
            <span className="text-xs text-surface-400">⛽ {vehicle.fuelType}</span>
          )}
          {vehicle.color && (
            <span className="text-xs text-surface-400">🎨 {vehicle.color}</span>
          )}
        </div>
      )}
    </Link>
  );
}

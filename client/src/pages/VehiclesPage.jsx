import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vehicles as vehiclesApi } from '../services/api';
import { Car, Plus, ChevronLeft, Gauge, Calendar, Fuel } from 'lucide-react';
import { formatDate } from '../utils/constants';

export default function VehiclesPage() {
  const [vehicleList, setVehicleList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehiclesApi.list().then(res => setVehicleList(res.vehicles)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">הרכבים שלי</h1>
        <Link to="/vehicles/new" className="btn-primary flex items-center gap-2"><Plus size={18} />הוסף רכב</Link>
      </div>

      {vehicleList.length === 0 ? (
        <div className="card p-12 text-center">
          <Car className="mx-auto text-surface-300 mb-4" size={48} />
          <p className="text-surface-500 mb-4">עדיין לא הוספת רכבים</p>
          <Link to="/vehicles/new" className="btn-primary inline-flex items-center gap-2"><Plus size={18} />הוסף רכב ראשון</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicleList.map(v => (
            <Link key={v.id} to={`/vehicles/${v.id}`} className="card p-5 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-4">
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-3xl">🚗</div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold">{v.nickname || `${v.manufacturer} ${v.model}`}</h3>
                  <p className="text-sm text-surface-500" dir="ltr">{v.licensePlate}</p>
                </div>
                <ChevronLeft size={20} className="text-surface-400 group-hover:text-brand-500 transition-colors" />
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-surface-500">
                <span className="flex items-center gap-1"><Calendar size={12} />{v.year}</span>
                {v.currentMileage && <span className="flex items-center gap-1"><Gauge size={12} />{v.currentMileage.toLocaleString()} ק״מ</span>}
                {v.fuelType && <span className="flex items-center gap-1"><Fuel size={12} />{v.fuelType}</span>}
              </div>

              {v.testExpiry && (
                <div className={`mt-3 text-xs font-medium px-2 py-1 rounded-lg inline-block ${
                  new Date(v.testExpiry) < new Date() ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  new Date(v.testExpiry) < new Date(Date.now() + 60*24*60*60*1000) ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  טסט: {formatDate(v.testExpiry)}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <span className="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-lg">{v._count.services} טיפולים</span>
                <span className="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-lg">{v._count.expenses} הוצאות</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

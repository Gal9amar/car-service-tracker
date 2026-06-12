import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vehicles as vehiclesApi } from '../services/api';
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
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
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    vehiclesApi.list()
      .then(res => setVehicleList(res.vehicles))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await vehiclesApi.delete(id);
    setDeleteConfirm(null);
    load();
  };

  const handleEdit = async (id, data) => {
    await vehiclesApi.update(id, data);
    setEditingVehicle(null);
    load();
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 fade-in" dir="rtl">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">הרכבים שלי</h1>
        <Link to="/vehicles/new"
          className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #0066CC 0%, #00B4A0 100%)', boxShadow: '0 4px 14px rgba(0,102,204,0.35)' }}>
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
          {vehicleList.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onEdit={() => setEditingVehicle(v)}
              onDelete={() => setDeleteConfirm(v)}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingVehicle && (
        <EditModal
          vehicle={editingVehicle}
          onSave={(data) => handleEdit(editingVehicle.id, data)}
          onClose={() => setEditingVehicle(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-lg font-bold mb-2">מחיקת רכב</p>
            <p className="text-surface-500 text-sm mb-6">
              למחוק את <strong>{deleteConfirm.manufacturer} {deleteConfirm.model}</strong>?
              פעולה זו תמחק את כל הטיפולים וההוצאות של הרכב.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">ביטול</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleCard({ vehicle, onEdit, onDelete }) {
  const status = testStatus(vehicle.testExpiry);
  const testChip = {
    expired: { bg: '#FEE2E2', color: '#DC2626' },
    soon:    { bg: '#FEF3C7', color: '#D97706' },
    ok:      { bg: '#DCFCE7', color: '#16A34A' },
  }[status] || { bg: '#F0F4F8', color: '#7896B0' };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden transition-all hover:shadow-md"
      style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>

      {/* BYD color band */}
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' }} />

      <div className="px-4 py-3">
        {/* Top: icon + name + actions */}
        <div className="flex items-center gap-3 mb-3">
          <Link to={`/vehicles/${vehicle.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: '#EFF7FF' }}>🚗</div>
            <div className="min-w-0">
              <p className="font-bold text-surface-900 dark:text-white text-sm leading-tight truncate">
                {vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}
              </p>
              <p className="text-xs text-surface-400">{vehicle.year}{vehicle.fuelType ? ` · ${vehicle.fuelType}` : ''}</p>
            </div>
          </Link>
          <div className="flex gap-2 shrink-0">
            <button onClick={onEdit} className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors" style={{ background: '#F0F4F8', color: '#556F8A' }}>
              ערוך
            </button>
            <button onClick={onDelete} className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition-colors hover:opacity-90" style={{ background: '#EF4444' }}>
              מחק
            </button>
          </div>
        </div>

        {/* Plate */}
        <div className="flex justify-center mb-3">
          <IsraeliPlate number={vehicle.licensePlate} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl px-3 py-2 text-center" style={{ background: '#F0F4F8' }}>
            <p className="text-xs text-surface-400 mb-0.5">שנה</p>
            <p className="text-sm font-bold text-surface-800 dark:text-white">{vehicle.year}</p>
          </div>

          <div className="rounded-xl px-3 py-2 text-center" style={{ background: '#EFF7FF' }}>
            <p className="text-xs mb-0.5" style={{ color: '#4AA3F8' }}>טיפולים</p>
            <p className="text-sm font-black" style={{ color: '#0066CC' }}>{vehicle._count?.services ?? 0}</p>
          </div>

          <div className="rounded-xl px-3 py-2 text-center" style={{ background: testChip.bg }}>
            <p className="text-xs mb-0.5" style={{ color: testChip.color, opacity: 0.7 }}>טסט</p>
            <p className="text-sm font-bold leading-tight" style={{ color: testChip.color }}>
              {vehicle.testExpiry ? formatDate(vehicle.testExpiry) : '—'}
            </p>
          </div>
        </div>

      {/* Mileage / fuel / color */}
      {(vehicle.currentMileage || vehicle.fuelType || vehicle.color) && (
        <div className="flex gap-3 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700 flex-wrap">
          {vehicle.currentMileage && (
            <span className="text-xs text-surface-400">🛣️ {vehicle.currentMileage.toLocaleString('he-IL')}</span>
          )}
          {vehicle.fuelType && (
            <span className="text-xs text-surface-400">⛽ {vehicle.fuelType}</span>
          )}
          {vehicle.color && (
            <span className="text-xs text-surface-400">🎨 {vehicle.color}</span>
          )}
        </div>
      )}
    </div>
  );
}

function EditModal({ vehicle, onSave, onClose }) {
  const [form, setForm] = useState({
    nickname:       vehicle.nickname || '',
    currentMileage: vehicle.currentMileage || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        nickname:       form.nickname || null,
        currentMileage: form.currentMileage ? Number(form.currentMileage) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-sm shadow-2xl my-auto" dir="rtl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-100 dark:border-surface-700">
          <p className="font-bold text-lg">עריכת רכב</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label">כינוי</label>
            <input type="text" value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})}
              className="input" placeholder='לדוגמה: "הרכב של אבא"' />
          </div>

          <div>
            <label className="label">קילומטראז׳</label>
            <input type="number" value={form.currentMileage} onChange={e => setForm({...form, currentMileage: e.target.value})}
              className="input" placeholder="120000" dir="ltr" />
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">ביטול</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            שמור
          </button>
        </div>
      </div>
    </div>
  );
}

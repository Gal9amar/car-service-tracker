import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { vehicles as vehiclesApi } from '../services/api';
import { Plus, ChevronLeft, Pencil, Trash2, X, Check, Loader2, Camera } from 'lucide-react';
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
  const testBadgeStyle = {
    expired: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    soon:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ok:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl px-5 py-4 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-sm transition-all">

      {/* Top: make/model + action buttons */}
      <div className="flex items-center justify-between mb-4">
        <Link to={`/vehicles/${vehicle.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-900/30 overflow-hidden shrink-0">
            {vehicle.imageUrl ? (
              <img src={vehicle.imageUrl} alt={`${vehicle.manufacturer} ${vehicle.model}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-surface-900 dark:text-white leading-tight truncate">
              {vehicle.manufacturer} {vehicle.model}
            </p>
            {vehicle.nickname && <p className="text-xs text-surface-400 truncate">{vehicle.nickname}</p>}
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0 mr-2">
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
            <Pencil size={16} />
          </button>
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 size={16} />
          </button>
          <Link to={`/vehicles/${vehicle.id}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-300 hover:text-brand-500 transition-colors">
            <ChevronLeft size={18} />
          </Link>
        </div>
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(vehicle.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        nickname:       form.nickname || null,
        currentMileage: form.currentMileage ? Number(form.currentMileage) : null,
      });
      if (imageFile) {
        await vehiclesApi.uploadImage(vehicle.id, imageFile);
      }
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
          {/* Image upload */}
          <div>
            <label className="label">תמונת רכב</label>
            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden">
                <img src={imagePreview} alt="תמונת רכב" className="w-full h-full object-cover" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors">
                  <X size={14} />
                </button>
                <button onClick={() => imageInputRef.current.click()}
                  className="absolute bottom-2 left-2 bg-black/60 text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1 hover:bg-black/80 transition-colors">
                  <Camera size={12} /> החלף
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => imageInputRef.current.click()}
                className="w-full h-28 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl flex flex-col items-center justify-center gap-2 text-surface-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
                <Camera size={22} />
                <span className="text-sm">לחץ להוספת תמונה</span>
              </button>
            )}
          </div>

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

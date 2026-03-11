import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { garages as garagesApi } from '../services/api';
import { MapPin, Search, Star, ChevronLeft, Plus } from 'lucide-react';

export default function GaragesPage() {
  const [garageList, setGarageList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGarages = (params = {}) => {
    setLoading(true);
    garagesApi.list(params).then(res => setGarageList(res.garages)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchGarages(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGarages(search ? { search } : {});
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">מוסכים</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pr-10" placeholder="חיפוש לפי שם, עיר או כתובת..."
          />
        </div>
        <button type="submit" className="btn-primary">חפש</button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : garageList.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="mx-auto text-surface-300 mb-4" size={48} />
          <p className="text-surface-500">לא נמצאו מוסכים</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {garageList.map(g => (
            <Link key={g.id} to={`/garages/${g.id}`} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg">{g.name}</h3>
                  {g.city && <p className="text-sm text-surface-500 flex items-center gap-1"><MapPin size={14} />{g.city}</p>}
                  {g.address && <p className="text-xs text-surface-400 mt-1">{g.address}</p>}
                </div>
                <ChevronLeft size={20} className="text-surface-400 group-hover:text-brand-500 transition-colors" />
              </div>
              <div className="flex items-center gap-3 mt-3">
                {g.avgRating && (
                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                    <Star size={16} fill="currentColor" />{g.avgRating}
                  </span>
                )}
                <span className="text-xs text-surface-400">{g._count.reviews} ביקורות</span>
                {g.specialties?.length > 0 && (
                  <div className="flex gap-1">
                    {g.specialties.slice(0, 3).map(s => (
                      <span key={s} className="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

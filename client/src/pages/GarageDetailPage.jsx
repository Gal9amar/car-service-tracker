import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { garages as garagesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, MapPin, Phone, Star, Send } from 'lucide-react';
import { formatDate } from '../utils/constants';

export default function GarageDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGarage = () => {
    garagesApi.get(id).then(res => setGarage(res.garage)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchGarage(); }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      await garagesApi.addReview(id, { rating, comment: comment || undefined });
      setRating(0);
      setComment('');
      fetchGarage();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!garage) return <p className="text-center text-surface-500">מוסך לא נמצא</p>;

  const existingReview = garage.reviews?.find(r => r.user.id === user.id);

  return (
    <div className="space-y-6 fade-in max-w-3xl mx-auto">
      <Link to="/garages" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"><ArrowRight size={16} />חזרה למוסכים</Link>

      <div className="card p-6">
        <h1 className="font-display text-2xl font-bold">{garage.name}</h1>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-surface-500">
          {garage.city && <span className="flex items-center gap-1"><MapPin size={16} />{garage.address || garage.city}</span>}
          {garage.phone && <span className="flex items-center gap-1"><Phone size={16} />{garage.phone}</span>}
          {garage.avgRating && <span className="flex items-center gap-1 text-amber-500 font-medium"><Star size={16} fill="currentColor" />{garage.avgRating.toFixed(1)}</span>}
        </div>
        {garage.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {garage.specialties.map(s => <span key={s} className="text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-3 py-1 rounded-full">{s}</span>)}
          </div>
        )}
      </div>

      {/* Add review */}
      {!existingReview && (
        <div className="card p-6">
          <h3 className="font-bold mb-4">הוסף ביקורת</h3>
          <form onSubmit={handleReview} className="space-y-4">
            <div>
              <label className="label">דירוג</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} className="p-1 transition-transform hover:scale-110">
                    <Star size={28} className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">תגובה (אופציונלי)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="input min-h-[80px]" placeholder="ספר על החוויה שלך..." />
            </div>
            <button type="submit" disabled={!rating || submitting} className="btn-primary flex items-center gap-2">
              <Send size={16} />שלח ביקורת
            </button>
          </form>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h3 className="font-bold text-lg mb-4">ביקורות ({garage.reviews?.length || 0})</h3>
        {(!garage.reviews || garage.reviews.length === 0) ? (
          <div className="card p-8 text-center text-surface-500">אין ביקורות עדיין</div>
        ) : (
          <div className="space-y-3">
            {garage.reviews.map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-300">
                    {r.user.avatarUrl ? <img src={r.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : r.user.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{r.user.name}</p>
                    <p className="text-xs text-surface-400">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => <Star key={n} size={14} className={n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300'} />)}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-surface-600 dark:text-surface-400">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

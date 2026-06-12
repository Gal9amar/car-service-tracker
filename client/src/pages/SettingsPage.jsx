import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import { User, Save, Moon, Sun, LogOut, Trash2, Mail, AlertTriangle, Check } from 'lucide-react';

const BYD_BAND = { background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' };

export default function SettingsPage() {
  const { user, logout, deleteAccount, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState(user?.name || '');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput]             = useState('');
  const [deleting, setDeleting]                   = useState(false);
  const [deleteError, setDeleteError]             = useState('');

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await auth.update({ name });
      await checkAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim() !== user?.email) { setDeleteError('האימייל שהוזן אינו תואם.'); return; }
    setDeleting(true); setDeleteError('');
    try { await deleteAccount(); navigate('/login'); }
    catch (err) { setDeleteError(err.message || 'שגיאה במחיקת החשבון'); setDeleting(false); }
  };

  return (
    <div className="space-y-4 fade-in" dir="rtl">
      <div className="pt-1">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">אזור אישי</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
        <div className="h-1.5" style={BYD_BAND} />

        {/* Avatar row */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-4 border-b border-surface-100 dark:border-surface-700">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #0066CC 0%, #00B4A0 100%)', boxShadow: '0 4px 14px rgba(0,102,204,0.3)' }}>
            {user?.name?.[0] || 'א'}
          </div>
          <div>
            <p className="font-bold text-surface-900 dark:text-white">{user?.name || '—'}</p>
            <p className="text-sm text-surface-400" dir="ltr">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="label">שם</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Mail size={14} />אימייל</label>
            <input type="email" value={user?.email || ''} className="input bg-surface-50 dark:bg-surface-900 cursor-not-allowed" disabled dir="ltr" />
            <p className="text-xs text-surface-400 mt-1">לא ניתן לשנות את האימייל</p>
          </div>
          <div>
            <label className="label">חבר מאז</label>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-60"
            style={{ background: saved ? '#16A34A' : 'linear-gradient(135deg, #0066CC 0%, #00B4A0 100%)', boxShadow: '0 4px 14px rgba(0,102,204,0.3)', transition: 'background 0.3s' }}>
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור שינויים'}
          </button>
        </form>
      </div>

      {/* Appearance card */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
        <div className="h-1.5" style={BYD_BAND} />
        <div className="p-5">
          <h2 className="font-bold text-surface-900 dark:text-white mb-4">מראה</h2>
          <button onClick={toggleDarkMode}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-right"
            style={{ background: '#F0F4F8' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: darkMode ? '#FEF3C7' : '#1E2D3D' }}>
              {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-surface-300" />}
            </div>
            <span className="font-medium text-surface-700 dark:text-surface-200">{darkMode ? 'מצב בהיר' : 'מצב כהה'}</span>
          </button>
        </div>
      </div>

      {/* Account card */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,60,130,0.08)' }}>
        <div className="h-1.5" style={BYD_BAND} />
        <div className="p-5">
          <h2 className="font-bold text-surface-900 dark:text-white mb-4">חשבון</h2>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors font-medium">
            <LogOut size={18} />
            התנתקות
          </button>
        </div>
      </div>

      {/* Delete account card */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-red-100 dark:border-red-900/30" style={{ boxShadow: '0 2px 12px rgba(239,68,68,0.08)' }}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #EF4444 0%, #F97316 100%)' }} />
        <div className="p-5">
          <h2 className="font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
            <Trash2 size={18} />
            מחיקת חשבון
          </h2>
          <p className="text-sm text-surface-500 mb-4">
            מחיקת החשבון תמחק לצמיתות את כל הרכבים, הטיפולים, ההוצאות, הביטוחים והתזכורות שלך. לא ניתן לשחזר.
          </p>

          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm">
              <Trash2 size={16} />
              מחק את החשבון שלי
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  לאישור הזן את כתובת האימייל שלך: <strong dir="ltr">{user?.email}</strong>
                </p>
              </div>
              <input type="email" value={deleteInput}
                onChange={e => { setDeleteInput(e.target.value); setDeleteError(''); }}
                className="input border-red-200 dark:border-red-800 focus:border-red-500 focus:ring-red-500/20"
                placeholder="הזן אימייל לאישור" dir="ltr" autoFocus />
              {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50">
                  {deleting
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Trash2 size={16} />מחק לצמיתות</>}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(''); }}
                  className="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 transition-colors text-sm">
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

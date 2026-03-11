import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import { User, Save, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const { user, checkAuth } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await auth.update({ name });
      await checkAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <h1 className="font-display text-2xl font-bold">הגדרות</h1>

      {/* Profile */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><User size={20} />פרופיל</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">שם</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label">אימייל</label>
            <input type="email" value={user?.email || ''} className="input bg-surface-50 dark:bg-surface-900" disabled dir="ltr" />
            <p className="text-xs text-surface-400 mt-1">לא ניתן לשנות את האימייל</p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור שינויים'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4">מראה</h2>
        <button onClick={toggleDarkMode} className="btn-secondary flex items-center gap-3">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? 'מצב בהיר' : 'מצב כהה'}
        </button>
      </div>
    </div>
  );
}

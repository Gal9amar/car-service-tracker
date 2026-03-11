import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 dark:from-surface-950 dark:via-surface-900 dark:to-brand-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-500/25">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-white">מעקב טיפולים לרכב</h1>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold mb-6 text-center">הרשמה</h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">שם</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input pr-10" placeholder="השם שלך" required />
              </div>
            </div>

            <div>
              <label className="label">אימייל</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pr-10" placeholder="your@email.com" required dir="ltr" />
              </div>
            </div>

            <div>
              <label className="label">סיסמה</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} className="input pr-10 pl-10"
                  placeholder="לפחות 6 תווים" required minLength={6} dir="ltr"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={18} />הרשם</>}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            כבר יש לך חשבון? <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">התחבר</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

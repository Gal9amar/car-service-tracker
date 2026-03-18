import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'שגיאה בהתחברות');
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
          <p className="text-surface-500 mt-1">ניהול חכם של הטיפולים וההוצאות שלך</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold mb-6 text-center">התחברות</h2>

          {error && (
            <div className="p-3 rounded-xl text-sm mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••" required dir="ltr"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={18} />התחבר</>}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            אין לך חשבון?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">הרשם עכשיו</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

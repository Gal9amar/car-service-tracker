import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [pendingEmail, setPendingEmail] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const codeRefs = useRef([]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.register({ email, password, name });
      if (res.needsVerification) {
        setPendingEmail(res.email);
        setStep('verify');
      }
    } catch (err) {
      setError(err.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) return setError('יש להזין קוד בן 6 ספרות');
    setError('');
    setLoading(true);
    try {
      const res = await auth.verify({ email: pendingEmail, code: fullCode });
      login(res.user, res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'קוד שגוי');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await auth.register({ email, password, name });
      setCode(['', '', '', '', '', '']);
    } catch {
      // ignore
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
          {step === 'register' ? (
            <>
              <h2 className="text-xl font-bold mb-6 text-center">הרשמה</h2>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
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
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-100 dark:bg-brand-900/30 rounded-2xl mb-3">
                  <ShieldCheck size={28} className="text-brand-600" />
                </div>
                <h2 className="text-xl font-bold">אימות אימייל</h2>
                <p className="text-sm text-surface-500 mt-2">שלחנו קוד בן 6 ספרות ל-</p>
                <p className="text-sm font-medium text-brand-600 dir-ltr" dir="ltr">{pendingEmail}</p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-center gap-2" dir="ltr">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => codeRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeInput(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-surface-200 dark:border-surface-600 rounded-xl focus:border-brand-500 focus:outline-none dark:bg-surface-800 transition-colors"
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || code.join('').length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ShieldCheck size={18} />אמת חשבון</>}
                </button>
              </form>

              <p className="text-center text-sm text-surface-500 mt-4">
                לא קיבלת?{' '}
                <button onClick={handleResend} className="text-brand-600 hover:text-brand-700 font-medium">
                  שלח שוב
                </button>
              </p>

              <p className="text-center text-sm text-surface-500 mt-2">
                <button onClick={() => setStep('register')} className="text-surface-400 hover:text-surface-600">
                  ← חזור להרשמה
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

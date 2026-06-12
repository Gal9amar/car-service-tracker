import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, User, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { sendCode, verifyCode } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('email'); // 'email' | 'name' | 'code'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  const startTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await sendCode(email, step === 'name' ? name : undefined);
      if (result.needsName) { setStep('name'); return; }
      setStep('code');
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) { setError(err.message || 'שגיאה בשליחת הקוד'); }
    finally { setLoading(false); }
  };

  const doVerify = async (codeStr) => {
    setError('');
    setLoading(true);
    try {
      await verifyCode(email, codeStr);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'קוד שגוי');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally { setLoading(false); }
  };

  const handleDigitChange = (i, value) => {
    if (!/^\d*$/.test(value)) return;
    const d = [...digits];
    d[i] = value.slice(-1);
    setDigits(d);
    if (value && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleDigitKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'Enter') { const c = digits.join(''); if (c.length === 6) doVerify(c); }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
      doVerify(pasted);
    }
  };

  // auto-submit when all 6 filled
  useEffect(() => {
    if (step === 'code' && !loading) {
      const c = digits.join('');
      if (c.length === 6) doVerify(c);
    }
  }, [digits]);

  const headerSection = (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-500/25">
        <span className="text-3xl">🚗</span>
      </div>
      <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-white">מעקב טיפולים לרכב</h1>
      <p className="text-surface-500 mt-1">ניהול חכם של הטיפולים וההוצאות שלך</p>
    </div>
  );

  const errorBox = error && (
    <div className="p-3 rounded-xl text-sm mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
      {error}
    </div>
  );

  const spinner = <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />;

  if (step === 'email') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 dark:from-surface-950 dark:via-surface-900 dark:to-brand-950 p-4">
      <div className="w-full max-w-md">
        {headerSection}
        <div className="card p-8">
          <h2 className="text-xl font-bold mb-2 text-center">כניסה לחשבון</h2>
          <p className="text-center text-sm text-surface-500 mb-6">הזן את האימייל שלך ונשלח קוד כניסה</p>
          {errorBox}
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="label">אימייל</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input pr-10" placeholder="your@email.com" required dir="ltr" autoFocus />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? spinner : <><LogIn size={18} />שלח קוד כניסה</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  if (step === 'name') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 dark:from-surface-950 dark:via-surface-900 dark:to-brand-950 p-4">
      <div className="w-full max-w-md">
        {headerSection}
        <div className="card p-8">
          <h2 className="text-xl font-bold mb-2 text-center">הרשמה ראשונה</h2>
          <p className="text-center text-sm text-surface-500 mb-6">נראה שזו הפעם הראשונה שלך. מה שמך?</p>
          {errorBox}
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="label">אימייל</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input type="email" value={email} className="input pr-10 bg-surface-50 dark:bg-surface-800 cursor-not-allowed" readOnly dir="ltr" />
              </div>
            </div>
            <div>
              <label className="label">שם מלא</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input pr-10" placeholder="השם שלך" required minLength={2} autoFocus />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? spinner : <><LogIn size={18} />שלח קוד כניסה</>}
            </button>
          </form>
          <button type="button" onClick={() => { setStep('email'); setError(''); }} className="w-full text-center text-sm text-surface-500 hover:text-surface-700 mt-4">
            ← חזור
          </button>
        </div>
      </div>
    </div>
  );

  // step === 'code'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 dark:from-surface-950 dark:via-surface-900 dark:to-brand-950 p-4">
      <div className="w-full max-w-md">
        {headerSection}
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-100 dark:bg-brand-900/30 rounded-2xl mb-3">
              <span className="text-2xl">📧</span>
            </div>
            <h2 className="text-xl font-bold mb-1">הזן את קוד האימות</h2>
            <p className="text-sm text-surface-500">נשלח קוד ל-<span className="font-medium text-surface-700 dark:text-surface-300" dir="ltr">{email}</span></p>
          </div>
          {errorBox}
          <div className="flex gap-2 justify-center mb-6" dir="ltr">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleDigitKey(i, e)}
                onPaste={handlePaste}
                onFocus={e => e.target.select()}
                disabled={loading}
                className="w-11 h-14 text-center text-2xl font-bold border-2 border-surface-200 dark:border-surface-700 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white dark:bg-surface-800 text-surface-900 dark:text-white transition-colors disabled:opacity-50"
              />
            ))}
          </div>
          {loading && (
            <div className="flex justify-center mb-4">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="text-center">
            <button
              type="button"
              disabled={resendTimer > 0 || loading}
              onClick={handleSend}
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 disabled:text-surface-400 dark:disabled:text-surface-600 transition-colors"
            >
              {resendTimer > 0 ? `שלח קוד חדש (${resendTimer}s)` : 'לא קיבלת? שלח קוד חדש'}
            </button>
          </div>
          <button type="button" onClick={() => { setStep('email'); setDigits(['','','','','','']); setError(''); }} className="w-full text-center text-sm text-surface-500 hover:text-surface-700 mt-4">
            ← חזור
          </button>
        </div>
      </div>
    </div>
  );
}

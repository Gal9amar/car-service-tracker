import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, User, LogIn, ArrowRight } from 'lucide-react';

const HERO = 'linear-gradient(145deg, #003D82 0%, #0066CC 55%, #00B4A0 100%)';
const BTN  = 'linear-gradient(135deg, #0066CC 0%, #00B4A0 100%)';

export default function LoginPage() {
  const { sendCode, verifyCode } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]       = useState('email');
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [digits, setDigits]   = useState(['','','','','','']);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  const startTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; }), 1000);
  };

  const handleSend = async (e) => {
    e?.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await sendCode(email, step === 'name' ? name : undefined);
      if (r.needsName) { setStep('name'); return; }
      setStep('code'); startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) { setError(err.message || 'שגיאה בשליחת הקוד'); }
    finally { setLoading(false); }
  };

  const doVerify = async (code) => {
    setError(''); setLoading(true);
    try { await verifyCode(email, code); navigate('/dashboard'); }
    catch (err) {
      setError(err.message || 'קוד שגוי');
      setDigits(['','','','','','']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    finally { setLoading(false); }
  };

  const handleDigitChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const d = [...digits]; d[i] = v.slice(-1); setDigits(d);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleDigitKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'Enter') { const c = digits.join(''); if (c.length === 6) doVerify(c); }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0, 6);
    if (p.length === 6) { setDigits(p.split('')); inputRefs.current[5]?.focus(); doVerify(p); }
  };

  useEffect(() => {
    if (step === 'code' && !loading) { const c = digits.join(''); if (c.length === 6) doVerify(c); }
  }, [digits]);

  const Spinner = () => <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F4F8' }} dir="rtl">
      {/* BYD hero */}
      <div className="flex flex-col items-center justify-center pt-16 pb-20 px-5" style={{ background: HERO }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
          style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          🚗
        </div>
        <h1 className="font-display text-2xl font-black text-white mb-1">CarTrack</h1>
        <p className="text-white/65 text-sm text-center">ניהול חכם של הטיפולים וההוצאות שלך</p>
      </div>

      {/* Floating card */}
      <div className="flex-1 flex flex-col items-center -mt-8 px-4 pb-10">
        <div className="bg-white rounded-3xl w-full max-w-sm" style={{ boxShadow: '0 8px 40px rgba(0,60,130,0.14)' }}>
          <div className="h-1.5 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #0066CC 0%, #00B4A0 100%)' }} />

          <div className="p-6">
            {error && (
              <div className="p-3 rounded-xl text-sm mb-4 bg-red-50 border border-red-100 text-red-600">{error}</div>
            )}

            {step === 'email' && (
              <>
                <h2 className="text-xl font-bold mb-1 text-surface-900">כניסה לחשבון</h2>
                <p className="text-sm text-surface-400 mb-5">הזן את האימייל שלך ונשלח קוד כניסה</p>
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="label">אימייל</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="input pr-10" placeholder="your@email.com" required dir="ltr" autoFocus />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: BTN, boxShadow: '0 4px 14px rgba(0,102,204,0.35)' }}>
                    {loading ? <Spinner /> : <><LogIn size={18} />שלח קוד כניסה</>}
                  </button>
                </form>
              </>
            )}

            {step === 'name' && (
              <>
                <h2 className="text-xl font-bold mb-1 text-surface-900">הרשמה ראשונה</h2>
                <p className="text-sm text-surface-400 mb-5">נראה שזו הפעם הראשונה שלך. מה שמך?</p>
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="label">אימייל</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                      <input type="email" value={email} className="input pr-10 bg-surface-50 cursor-not-allowed" readOnly dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <label className="label">שם מלא</label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="input pr-10" placeholder="השם שלך" required minLength={2} autoFocus />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: BTN, boxShadow: '0 4px 14px rgba(0,102,204,0.35)' }}>
                    {loading ? <Spinner /> : <><LogIn size={18} />שלח קוד כניסה</>}
                  </button>
                </form>
                <button type="button" onClick={() => { setStep('email'); setError(''); }}
                  className="w-full text-center text-sm text-surface-400 hover:text-surface-600 mt-4 flex items-center justify-center gap-1">
                  <ArrowRight size={14} /> חזור
                </button>
              </>
            )}

            {step === 'code' && (
              <>
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl mb-3" style={{ background: '#EFF7FF' }}>
                    📧
                  </div>
                  <h2 className="text-xl font-bold mb-1 text-surface-900">קוד אימות</h2>
                  <p className="text-sm text-surface-400">נשלח קוד ל-<span className="font-medium text-surface-700" dir="ltr">{email}</span></p>
                </div>
                <div className="flex gap-2 justify-center mb-5" dir="ltr">
                  {digits.map((digit, i) => (
                    <input key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text" inputMode="numeric" pattern="\d*" maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKey(i, e)}
                      onPaste={handlePaste}
                      onFocus={e => e.target.select()}
                      disabled={loading}
                      className="w-11 h-14 text-center text-2xl font-bold rounded-xl outline-none text-surface-900 transition-all disabled:opacity-50"
                      style={{ border: digit ? '2px solid #0066CC' : '2px solid #D1DCE8', background: digit ? '#EFF7FF' : 'white' }}
                    />
                  ))}
                </div>
                {loading && (
                  <div className="flex justify-center mb-4">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="text-center mb-4">
                  <button type="button" disabled={resendTimer > 0 || loading} onClick={handleSend}
                    className="text-sm font-medium transition-colors"
                    style={{ color: resendTimer > 0 || loading ? '#A8BDD0' : '#0066CC' }}>
                    {resendTimer > 0 ? `שלח קוד חדש (${resendTimer}s)` : 'לא קיבלת? שלח קוד חדש'}
                  </button>
                </div>
                <button type="button" onClick={() => { setStep('email'); setDigits(['','','','','','']); setError(''); }}
                  className="w-full text-center text-sm text-surface-400 hover:text-surface-600 flex items-center justify-center gap-1">
                  <ArrowRight size={14} /> חזור
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

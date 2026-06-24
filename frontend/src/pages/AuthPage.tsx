import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to app when authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/app', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const err = mode === 'login'
      ? await login(email.trim(), password)
      : await signup(email.trim(), password, name.trim());

    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo-icon.png" alt="Lifevault" className="h-16 w-16 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-black text-white tracking-tight">Lifevault</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">One vault for your whole life</p>
        </div>

        {/* Card */}
        <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 p-8 shadow-xl">
          {/* Tabs */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 mb-8">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'login' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" /> Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'register' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" /> Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-sm font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                <>Sign In</>
              ) : (
                <>Create Account</>
              )}
            </button>

            {mode === 'login' && (
              <a href="/forgot-password" className="block text-center text-[11px] font-bold text-slate-500 hover:text-blue-400 transition-colors mt-2">
                Forgot password?
              </a>
            )}
          </form>

          <p className="text-center text-[10px] font-bold text-slate-600 mt-6">
            By continuing, you agree to our{' '}
            <a href="/privacy" className="text-blue-500 hover:text-blue-400">Privacy Policy</a>
            {' '}and{' '}
            <a href="/terms" className="text-blue-500 hover:text-blue-400">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}
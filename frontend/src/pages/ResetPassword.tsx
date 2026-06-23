import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Reset failed');
      } else {
        setDone(true);
      }
    } catch {
      setError('Could not connect to server');
    }
    setLoading(false);
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6">
        <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 p-8 text-center">
          <p className="text-rose-400 font-bold">Invalid reset link</p>
          <a href="/forgot-password" className="text-blue-500 text-sm mt-4 block">Request a new one</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src="/logo-icon.png" alt="Lifevault" className="h-16 w-16 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-black text-white tracking-tight">Set New Password</h1>
        </div>

        <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 p-8 shadow-xl">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <p className="text-slate-200 font-bold text-lg">Password Reset!</p>
              <p className="text-slate-500 text-sm">Your password has been updated successfully.</p>
              <button onClick={() => navigate('/auth')} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all">
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-slate-400 text-sm font-medium">Enter your new password for <strong className="text-slate-300">{email}</strong></p>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-sm font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
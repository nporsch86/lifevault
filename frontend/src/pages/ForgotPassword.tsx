import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setSent(true);
        if (data.resetLink) setResetLink(data.resetLink);
      }
    } catch {
      setError('Could not connect to server');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src="/logo-icon.png" alt="Lifevault" className="h-16 w-16 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-black text-white tracking-tight">Reset Password</h1>
        </div>

        <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 p-8 shadow-xl">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <p className="text-slate-200 font-bold text-lg">Check your email</p>
              <p className="text-slate-500 text-sm">If an account exists for <strong className="text-slate-300">{email}</strong>, you'll receive a reset link shortly.</p>
              {resetLink && (
                <div className="bg-slate-800/50 rounded-xl p-4 mt-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Beta quick link:</p>
                  <a href={resetLink} className="text-blue-500 hover:text-blue-400 text-sm font-bold break-all">{resetLink}</a>
                </div>
              )}
              <a href="/auth" className="inline-block mt-4 text-blue-500 hover:text-blue-400 text-sm font-bold">Back to Sign In</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-slate-400 text-sm font-medium">Enter your email and we'll send you a reset link.</p>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
              <a href="/auth" className="block text-center text-slate-500 hover:text-slate-300 text-sm font-bold transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Sign In
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
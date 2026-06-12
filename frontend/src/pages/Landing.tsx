import { useState, useEffect } from 'react';
import { CalendarDays, CheckSquare, Wallet, ShieldCheck, StickyNote, ArrowRight, Star, Clock, Mail, MessageSquare } from 'lucide-react';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');
  const [signedUp, setSignedUp] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('https://lifevault-514e.onrender.com/api/waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch {}
    setSignedUp(true);
    setEmail('');
  };

  const handleSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('https://lifevault-514e.onrender.com/api/suggestions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion })
      });
    } catch {}
    setSuggestionSent(true);
    setSuggestion('');
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      {/* Nav */}
      <nav className={`fixed top-0 w-full z-50 transition-all ${scrolled ? 'bg-[#0f1115]/95 backdrop-blur border-b border-slate-800' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo-sidebar.png" alt="Lifevault" className="h-8 w-auto" />
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => scrollTo('features')} className="text-slate-400 hover:text-white text-sm font-medium transition">Features</button>
            <button onClick={() => scrollTo('download')} className="text-slate-400 hover:text-white text-sm font-medium transition">Download</button>
            <button onClick={() => scrollTo('pricing')} className="text-slate-400 hover:text-white text-sm font-medium transition">Pricing</button>
            <a href="/app" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/25">
              Get Started Free
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-blue-500/20">✨ Your digital life planner</div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            One vault for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">your whole life</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Replace paper planners, scattered apps, and sticky notes with one smart planner 
            that works on your tablet, phone, and desktop.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <a href="/app" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-lg font-bold transition shadow-xl shadow-blue-600/30 flex items-center">
              Start Planning Free <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-4">No credit card required • Free forever plan</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Everything you need, nothing you don't</h2>
          <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">From daily planning to expense tracking — all in one beautiful app</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: CalendarDays, title: "Daily, Weekly, Monthly Views", desc: "Zoom in and out on your schedule. Pinch to switch between day, week, and month views." },
              { icon: CheckSquare, title: "Smart To-Do Lists", desc: "Tasks auto-roll to the next day if unfinished. Prioritize, categorize, and never lose track." },
              { icon: Wallet, title: "Expense Tracking & Budgets", desc: "Track spending, scan receipts, set monthly budgets, and flag expenses for taxes." },
              { icon: StickyNote, title: "Handwriting Notes", desc: "Write with your stylus on the Canvas. 16 colors, highlighters, and AI summaries (premium)." },
              { icon: ShieldCheck, title: "Confidential Calendar", desc: "Biometric-locked private events. Face ID / fingerprint required to view." },
              { icon: Clock, title: "Calendar Sync", desc: "Sync with Google, Apple, and Outlook calendars. All your events in one place." },
            ].map((f, i) => (
              <div key={i} className="bg-[#16191e] border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition">
                  <f.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download / Install */}
      <section id="download" className="py-20 px-6 bg-[#0a0c10]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-blue-500/20">
            📱 Works on every device
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-6">Use Lifevault anywhere</h2>
          <p className="text-slate-400 mb-12 max-w-xl mx-auto">Install it on your phone, tablet, or desktop — it works offline and syncs everywhere.</p>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-[#16191e] border border-slate-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                iPhone / iPad
              </h3>
              <ol className="space-y-3 text-slate-300 text-sm">
                <li><span className="text-blue-400 font-bold">1.</span> Open Safari and go to <span className="text-blue-300">lifevault.online</span></li>
                <li><span className="text-blue-400 font-bold">2.</span> Tap the <strong>Share</strong> button (square with arrow)</li>
                <li><span className="text-blue-400 font-bold">3.</span> Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li><span className="text-blue-400 font-bold">4.</span> Tap <strong>"Add"</strong> — it installs like an app!</li>
              </ol>
            </div>
            
            <div className="bg-[#16191e] border border-slate-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18 10V7c0-.5-.2-1-.5-1.4L15 3.2c-.4-.4-.9-.6-1.4-.6H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3"/><path d="M15 3v4c0 .6.4 1 1 1h4"/><circle cx="12" cy="15" r="2"/><path d="M9 15H3"/></svg>
                Android / Tablet
              </h3>
              <ol className="space-y-3 text-slate-300 text-sm">
                <li><span className="text-blue-400 font-bold">1.</span> Open Chrome and go to <span className="text-blue-300">lifevault.online</span></li>
                <li><span className="text-blue-400 font-bold">2.</span> Tap the <strong>three-dot menu</strong> (top right)</li>
                <li><span className="text-blue-400 font-bold">3.</span> Tap <strong>"Add to Home screen"</strong></li>
                <li><span className="text-blue-400 font-bold">4.</span> Tap <strong>"Install"</strong> — it's ready to use!</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Simple pricing</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Free", price: "$0", period: "forever", features: ["Daily & Weekly planner", "Basic to-do lists", "Basic expense tracking", "Canvas notes (basic)"], cta: "Get Started", popular: false },
              { name: "Premium", price: "$12.99", period: "/month", features: ["Everything in Free", "Calendar sync (all 3)", "Confidential calendar", "AI meeting summaries", "Receipt scanning", "Budget planning", "Monthly & Annual views", "Cloud backup"], cta: "Upgrade", popular: true },
              { name: "Lifetime", price: "$249", period: "one-time", features: ["All Premium features", "No recurring charges", "Priority support", "Early access to new features", "Lifetime updates"], cta: "Get Lifetime", popular: false },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl p-8 ${p.popular ? 'bg-blue-600 border-2 border-blue-400 relative' : 'bg-[#16191e] border border-slate-800'}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-400 text-blue-900 text-xs font-black px-4 py-1 rounded-full">MOST POPULAR</div>}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <div className="mb-6"><span className="text-4xl font-black">{p.price}</span><span className="text-slate-400 text-sm ml-1">{p.period}</span></div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start text-sm"><Star className="w-4 h-4 text-blue-400 mr-2 mt-0.5 shrink-0" /><span>{f}</span></li>
                  ))}
                </ul>
                <a href="/app" className={`block text-center py-3 rounded-xl font-bold transition ${p.popular ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stay Updated & Suggestions */}
      <section className="py-20 px-6 bg-[#0a0c10]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Email Signup */}
          <div className="bg-[#16191e] border border-slate-800 rounded-2xl p-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Stay updated</h3>
            <p className="text-slate-400 text-sm mb-6">Get notified about new features, tips, and updates.</p>
            {signedUp ? (
              <p className="text-green-400 font-bold">🎉 You're signed up! Thanks.</p>
            ) : (
              <form onSubmit={handleSignup} className="flex space-x-3">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
                  className="flex-1 bg-[#0f1115] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition">Join</button>
              </form>
            )}
          </div>

          {/* Suggestions */}
          <div className="bg-[#16191e] border border-slate-800 rounded-2xl p-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Suggest a feature</h3>
            <p className="text-slate-400 text-sm mb-6">Help us make Lifevault better. What would you like to see?</p>
            {suggestionSent ? (
              <p className="text-green-400 font-bold">🙏 Thanks for the suggestion!</p>
            ) : (
              <form onSubmit={handleSuggestion}>
                <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="I'd love to see..."
                  className="w-full bg-[#0f1115] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-3 h-24 resize-none" />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition">Send</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2"><img src="/logo-sidebar.png" alt="Lifevault" className="h-6 w-auto" /></div>
          <p className="text-slate-500 text-sm">© 2026 Lifevault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
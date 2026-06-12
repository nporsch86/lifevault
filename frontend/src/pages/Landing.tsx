import { useState, useEffect } from 'react';
import { CalendarDays, CheckSquare, Wallet, ShieldCheck, StickyNote, ArrowRight, Star, Clock } from 'lucide-react';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

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
          <div className="inline-flex items-center bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-blue-500/20">
            ✨ Your digital life planner
          </div>
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

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-[#0a0c10]">
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
                <div className="mb-6">
                  <span className="text-4xl font-black">{p.price}</span>
                  <span className="text-slate-400 text-sm ml-1">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start text-sm">
                      <Star className="w-4 h-4 text-blue-400 mr-2 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="/app" className={`block text-center py-3 rounded-xl font-bold transition ${p.popular ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo-sidebar.png" alt="Lifevault" className="h-6 w-auto" />
          </div>
          <p className="text-slate-500 text-sm">© 2026 Lifevault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
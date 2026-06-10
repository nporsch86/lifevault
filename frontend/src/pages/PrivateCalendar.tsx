import { useState, useEffect, useCallback } from 'react';
import { Lock, Fingerprint, Plus, ChevronLeft, ChevronRight, EyeOff, ShieldAlert, Key } from 'lucide-react';

interface PrivateEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  category: 'Private' | 'Confidential';
  notes?: string;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DATES = [23, 24, 25, 26, 27, 28, 29];

export default function PrivateCalendar() {
  const [isLocked, setIsLocked] = useState(true);
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pin, setPin] = useState('');
  
  const [events, setEvents] = useState<PrivateEvent[]>([
    { id: '1', title: 'Private: Therapy', time: '3:00 pm', date: '2025-10-25', category: 'Private', notes: 'Weekly session' },
    { id: '2', title: 'Confidential: Client Call', time: '4:00 pm', date: '2025-10-26', category: 'Confidential', notes: 'Project Alpha discussion' },
    { id: '3', title: 'Private: Dr. Appointment', time: '10:00 am', date: '2025-10-28', category: 'Private', notes: 'General checkup' },
  ]);

  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    date: '',
    notes: ''
  });

  // Auto-lock after 2 minutes of inactivity (simulated)
  const lockVault = useCallback(() => {
    setIsLocked(true);
    setShowPinFallback(false);
    setPin('');
  }, []);

  useEffect(() => {
    if (isLocked) return;

    const timer = setTimeout(() => {
      lockVault();
    }, 120000); // 2 minutes

    const handleActivity = () => {
      clearTimeout(timer);
      setTimeout(() => lockVault(), 120000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isLocked, lockVault]);

  const handleUnlock = () => {
    // Simulate biometric unlock
    setIsLocked(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { // Mock PIN
      setIsLocked(false);
    } else {
      alert('Incorrect PIN');
      setPin('');
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.time || !newEvent.date) return;
    
    const event: PrivateEvent = {
      id: Math.random().toString(36).substr(2, 9),
      ...newEvent,
      category: 'Confidential',
    };
    
    setEvents([...events, event]);
    setNewEvent({ title: '', time: '', date: '', notes: '' });
  };

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-8">
        <div className="space-y-1">
          <p className="text-purple-500 font-black text-xs uppercase tracking-[0.2em]">Confidential</p>
          <h2 className="text-4xl font-black text-slate-100 tracking-tight">Private Vault</h2>
        </div>
        {!isLocked && (
          <button 
            onClick={lockVault}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all border border-slate-700 font-bold text-sm"
          >
            <EyeOff className="w-4 h-4" />
            <span>Lock Vault</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 relative">
        {/* Left Side: Calendar View */}
        <div className="bg-[#1a1a2e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden flex flex-col h-[650px] relative">
          <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
            <h3 className="font-black text-slate-100 tracking-tight">CALENDAR</h3>
            <div className="flex items-center space-x-2">
              <ChevronLeft className="w-5 h-5 text-slate-500 cursor-pointer" />
              <ChevronRight className="w-5 h-5 text-slate-500 cursor-pointer" />
            </div>
          </div>
          
          <div className={`flex-1 p-6 transition-all duration-500 ${isLocked ? 'blur-2xl grayscale opacity-50' : ''}`}>
             <div className="grid grid-cols-7 gap-2 mb-8">
                {DAYS.map((day, i) => (
                  <div key={day} className="text-center">
                    <p className="text-[10px] font-black text-slate-600 mb-1">{day}</p>
                    <div className={`p-3 rounded-2xl border transition-all ${DATES[i] === 25 ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                       <p className="font-black text-lg">{DATES[i]}</p>
                    </div>
                  </div>
                ))}
             </div>

             <div className="space-y-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Time Blocks</p>
                <div className="space-y-3">
                   {[9, 10, 11, 12, 1, 2, 3, 4].map(h => (
                     <div key={h} className="flex items-center space-x-4 h-12 border-t border-slate-800/30">
                        <span className="text-[10px] font-bold text-slate-600 w-8">{h} {h >= 9 && h < 12 ? 'AM' : 'PM'}</span>
                        <div className="flex-1 bg-slate-800/20 rounded-xl"></div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {isLocked && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#1a1a2e]/40 backdrop-blur-sm p-8">
               {!showPinFallback ? (
                 <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-300">
                    <div 
                      onClick={handleUnlock}
                      className="group cursor-pointer flex flex-col items-center space-y-6"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-32 h-32 rounded-full border-2 border-blue-500/30 flex items-center justify-center group-hover:border-blue-500/60 transition-all shadow-[0_0_50px_rgba(37,99,235,0.1)] group-hover:shadow-[0_0_60px_rgba(37,99,235,0.2)]">
                           <Fingerprint className="w-16 h-16 text-blue-500 drop-shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-xl font-black text-slate-100 tracking-tight">Unlock Private Vault</p>
                        <p className="text-sm font-bold text-slate-500">Use biometrics to view confidential events</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowPinFallback(true)}
                      className="text-slate-500 hover:text-blue-400 text-xs font-bold transition-colors flex items-center space-x-2"
                    >
                      <Key className="w-3 h-3" />
                      <span>Use PIN Fallback</span>
                    </button>
                 </div>
               ) : (
                 <div className="w-full max-w-xs space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="text-center space-y-2">
                       <ShieldAlert className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                       <h3 className="text-xl font-black text-slate-100">Enter Security PIN</h3>
                       <p className="text-xs font-bold text-slate-500">Enter your 4-digit vault code</p>
                    </div>
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                       <input 
                         type="password"
                         maxLength={4}
                         placeholder="••••"
                         autoFocus
                         className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-center text-2xl tracking-[1em] text-blue-500 focus:outline-none focus:border-blue-500 transition-all"
                         value={pin}
                         onChange={e => setPin(e.target.value)}
                       />
                       <button 
                         type="submit"
                         className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all"
                       >
                         Verify PIN
                       </button>
                    </form>
                    <button 
                      onClick={() => setShowPinFallback(false)}
                      className="w-full text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors"
                    >
                      Back to Biometrics
                    </button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Right Side: Events & Form */}
        <div className="space-y-8 flex flex-col h-[650px]">
           <div className="bg-[#1a1a2e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                <h3 className="font-black text-slate-100 tracking-tight uppercase tracking-[0.1em]">Private Events</h3>
                <span className="text-[10px] font-black text-slate-500 px-2 py-1 bg-slate-800 rounded-lg">SECURE SESSION</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {isLocked ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-slate-800/30 border border-slate-700/30 p-5 rounded-2xl flex items-center justify-between opacity-40 grayscale">
                        <div className="flex items-center space-x-4">
                           <div className="p-2 bg-slate-700 rounded-xl">
                              <Lock className="w-5 h-5 text-slate-500" />
                           </div>
                           <div className="space-y-1">
                              <div className="h-4 w-32 bg-slate-700 rounded animate-pulse"></div>
                              <div className="h-3 w-16 bg-slate-700 rounded animate-pulse"></div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                       <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${event.category === 'Confidential' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                             <Lock className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="font-black text-slate-100">{event.title}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{event.time} • {event.date}</p>
                             {event.notes && <p className="text-xs text-slate-400 mt-1 italic">{event.notes}</p>}
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>

              {!isLocked && (
                <div className="p-6 border-t border-slate-800/50 bg-slate-900/30">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Create Confidential Entry</h4>
                  <form onSubmit={handleAddEvent} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Event Title"
                        required
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        value={newEvent.title}
                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Time (e.g. 5:00 pm)"
                        required
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        value={newEvent.time}
                        onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="date" 
                        required
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        value={newEvent.date}
                        onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Notes (optional)"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        value={newEvent.notes}
                        onChange={e => setNewEvent({...newEvent, notes: e.target.value})}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-purple-600 text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Confidential Event</span>
                    </button>
                  </form>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

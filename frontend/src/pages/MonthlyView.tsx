import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MonthEvent {
  id: string;
  title: string;
  date: number; // day of month
  category: 'Work' | 'Personal' | 'Important' | 'Confidential';
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const categoryColors: Record<string, string> = {
  Work: 'bg-blue-500',
  Personal: 'bg-green-500',
  Important: 'bg-blue-600',
  Confidential: 'bg-purple-500',
};

export default function MonthlyView() {
  const navigate = useNavigate();
  const [currentMonth] = useState('October 2025');
  
  // Mock data for the grid (October 2025 starts on Wednesday)
  const daysInMonth = 31;
  const startDay = 3; // 0=Sun, 3=Wed
  const totalSlots = 35; // 5 weeks
  
  const [events] = useState<MonthEvent[]>([
    { id: '1', title: 'Team Meeting', date: 20, category: 'Work' },
    { id: '2', title: 'Dinner with Sarah', date: 22, category: 'Personal' },
    { id: '3', title: 'Doctor Appointment', date: 24, category: 'Important' },
    { id: '4', title: 'Project Review', date: 8, category: 'Work' },
    { id: '5', title: 'Birthday', date: 15, category: 'Personal' },
    { id: '6', title: 'Confidential Sync', date: 29, category: 'Confidential' },
  ]);

  const upcomingEvents = events.filter(e => e.date >= 20).sort((a, b) => a.date - b.date);

  return (
    <div className="flex h-full gap-10">
      {/* Side Panel */}
      <div className="w-80 flex flex-col space-y-10">
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-100 tracking-tight flex items-center">
            Upcoming
          </h3>
          <div className="space-y-4">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-start space-x-3 group cursor-pointer">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${categoryColors[event.category]}`}></div>
                <div>
                  <p className="text-slate-200 font-bold group-hover:text-blue-600 transition-colors">{event.title}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Oct {event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-100 tracking-tight">
            Monthly Budget Summary
          </h3>
          <div className="bg-[#16191e] rounded-3xl p-8 border border-slate-800/50 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Simple Circular Progress Mockup */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="364.4" strokeDashoffset="127.5" className="text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-100 tracking-tighter">65%</span>
              </div>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">used</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             {Object.entries(categoryColors).map(([name, color]) => (
               <div key={name} className="flex items-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${color}`}></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h2 className="text-4xl font-black text-slate-100 tracking-tight">{currentMonth}</h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          <button className="bg-blue-600 text-slate-950 px-6 py-2 rounded-xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all text-sm uppercase tracking-wider">
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-800 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Day Headers */}
          {DAYS_SHORT.map(day => (
            <div key={day} className="bg-[#16191e] py-4 text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{day}</span>
            </div>
          ))}

          {/* Grid Slots */}
          {Array.from({ length: totalSlots }).map((_, idx) => {
            const dayNumber = idx - startDay + 1;
            const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
            const dayEvents = events.filter(e => e.date === dayNumber);
            const isToday = dayNumber === 29;

            return (
              <div 
                key={idx} 
                onClick={() => isCurrentMonth && navigate('/')}
                className={`min-h-[120px] p-4 bg-[#16191e] hover:bg-slate-800/50 transition-colors cursor-pointer group relative
                  ${!isCurrentMonth ? 'opacity-20' : ''}
                  ${isToday ? 'ring-2 ring-blue-600/50 ring-inset bg-blue-600/[0.03]' : ''}
                `}
              >
                <span className={`text-lg font-black ${isToday ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {isCurrentMonth ? dayNumber : ''}
                </span>
                
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className={`w-2 h-2 rounded-full ${categoryColors[event.category]} shadow-[0_0_6px_rgba(0,0,0,0.3)]`}
                      title={event.title}
                    ></div>
                  ))}
                </div>

                {isToday && (
                   <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { ChevronLeft, ChevronRight, CheckSquare, Plus, FileText, Video, Car, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanner } from '../store/PlannerContext';
import AddEventModal from '../components/AddEventModal';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const categoryColors: Record<string, string> = {
  Work: 'bg-blue-600 text-blue-50 border-blue-500',
  Personal: 'bg-emerald-600 text-emerald-50 border-emerald-500',
  Important: 'bg-rose-600 text-rose-50 border-rose-500',
  Confidential: 'bg-purple-600 text-purple-50 border-purple-500',
  Bill: 'bg-amber-500 text-amber-950 border-amber-400',
  Medical: 'bg-teal-600 text-teal-50 border-teal-500',
  Family: 'bg-indigo-600 text-indigo-50 border-indigo-500',
  Health: 'bg-cyan-600 text-cyan-50 border-cyan-500',
};

const categoryDots: Record<string, string> = {
  Work: 'bg-blue-500',
  Personal: 'bg-emerald-500',
  Important: 'bg-rose-500',
  Confidential: 'bg-purple-500',
  Bill: 'bg-amber-500',
  Medical: 'bg-teal-500',
  Family: 'bg-indigo-500',
  Health: 'bg-cyan-500',
};

export default function MonthlyView() {
  const navigate = useNavigate();
  const { events, tasks } = usePlanner();
  const [currentMonth] = useState('October 2025');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const selectedDate = '2025-10-29';
  
  const daysInMonth = 31;
  const startDay = 3; // 0=Sun, 3=Wed
  const totalSlots = 35; // 5 weeks
  const todayDateStr = '2025-10-29';
  const today = new Date(todayDateStr);

  const upcomingEvents = events
    .filter(e => e.date >= todayDateStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const getWeekNumber = (slotIndex: number) => {
    const baseWeek = 40;
    return baseWeek + Math.floor(slotIndex / 7);
  };

  const getBillStatus = (dateStr: string, isPaid: boolean) => {
    if (isPaid) return 'paid';
    const dueDate = new Date(dateStr);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'soon';
    return 'pending';
  };

  const getBillBadge = (dateStr: string, isPaid: boolean) => {
    if (isPaid) return null;
    const dueDate = new Date(dateStr);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Overdue ${Math.abs(diffDays)}d`, color: 'bg-rose-600' };
    if (diffDays === 0) return { text: 'Due Today', color: 'bg-amber-600' };
    if (diffDays === 1) return { text: 'Due Tomorrow', color: 'bg-amber-500' };
    if (diffDays <= 3) return { text: `Due in ${diffDays}d`, color: 'bg-amber-500' };
    return null;
  };

  return (
    <div className="flex h-full gap-8">
      {/* Side Panel */}
      <div className="w-72 flex flex-col space-y-8">
        <div className="bg-[#1a1a2e] rounded-3xl p-6 border border-slate-800/50 shadow-xl">
          <h3 className="text-lg font-black text-slate-100 tracking-tight mb-6 uppercase tracking-widest text-blue-500">
            October Focus
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
               <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Goal Completion</span>
                  <span>75%</span>
               </div>
               <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }}></div>
               </div>
            </div>
            <div className="space-y-4 pt-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Next Up</h4>
              {upcomingEvents.slice(0, 3).map(event => (
                <div key={event.id} className="flex items-center space-x-3 group cursor-pointer">
                  <div className={`w-1.5 h-6 rounded-full ${categoryDots[event.category]}`}></div>
                  <div className="min-w-0">
                    <p className="text-slate-200 font-bold text-sm truncate group-hover:text-blue-400 transition-colors">{event.title}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      {event.category === 'Bill' ? `$${event.amount}` : event.date.split('-').slice(1).join('/')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-3xl p-6 border border-slate-800/50 shadow-xl flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Categories
            </h3>
            <div className="space-y-3">
               {Object.entries(categoryDots).map(([name, color]) => (
                 <div key={name} className="flex items-center justify-between group cursor-pointer">
                   <div className="flex items-center space-x-3">
                     <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-lg shadow-black/20`}></div>
                     <span className="text-xs font-bold text-slate-300 group-hover:text-slate-100 transition-colors">{name}</span>
                   </div>
                   <span className="text-[10px] font-bold text-slate-600">{events.filter(e => e.category === name).length}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50">
             <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400">Monthly Tasks</span>
                <span className="text-xs font-black text-slate-200">
                  {tasks.filter(t => t.completed).length}/{tasks.length}
                </span>
             </div>
             <div className="flex gap-1 h-8 items-end">
                {[4, 7, 2, 8, 5, 9, 3].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-800 rounded-t-sm relative group">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-600/50 group-hover:bg-blue-500 rounded-t-sm transition-all" 
                      style={{ height: `${h * 10}%` }}
                    ></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h2 className="text-4xl font-black text-slate-100 tracking-tight">{currentMonth}</h2>
            <div className="flex items-center bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
              <button className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <button className="text-slate-400 font-black text-xs uppercase tracking-widest px-4 py-2 hover:text-slate-200 transition-colors">
               Today
             </button>
             <button 
               onClick={() => setIsEventModalOpen(true)}
               className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all text-xs uppercase tracking-widest flex items-center"
             >
               <Plus className="w-4 h-4 mr-2" /> New Event
             </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-800/50 border border-slate-800/50 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm relative">
          
          <div className="grid grid-cols-[40px_repeat(7,1fr)] bg-[#1a1a2e]/80 border-b border-slate-800/50">
            <div className="py-4 border-r border-slate-800/30"></div>
            {DAYS_SHORT.map(day => (
              <div key={day} className="py-4 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[40px_repeat(7,1fr)] flex-1 divide-x divide-y divide-slate-800/50">
            {Array.from({ length: totalSlots }).map((_, idx) => {
              const dayNumber = idx - startDay + 1;
              const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
              const dateStr = `2025-10-${dayNumber.toString().padStart(2, '0')}`;
              
              const dayEvents = events.filter(e => e.date === dateStr);
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const hasHighPriority = dayTasks.some(t => t.priority === 'high' && !t.completed);
              const isToday = dateStr === todayDateStr;

              return (
                <React.Fragment key={idx}>
                  {/* Week Number column */}
                  {idx % 7 === 0 && (
                    <div className="bg-[#16162a] flex items-center justify-center border-r border-slate-800/50">
                      <span className="text-[9px] font-black text-slate-700 -rotate-90">W{getWeekNumber(idx)}</span>
                    </div>
                  )}

                  <div 
                    onClick={() => isCurrentMonth && navigate('/')}
                    className={`min-h-[140px] p-2 bg-[#1a1a2e]/40 hover:bg-slate-800/40 transition-all cursor-pointer group relative flex flex-col
                      ${!isCurrentMonth ? 'opacity-5 pointer-events-none' : ''}
                      ${isToday ? 'bg-blue-600/[0.05] ring-2 ring-blue-600/20 ring-inset' : ''}
                      ${hasHighPriority ? 'border-l-2 border-l-rose-500/50' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-col">
                          <span className={`text-lg font-black transition-colors ${isToday ? 'text-blue-500 font-black' : 'text-slate-600 group-hover:text-slate-300'}`}>
                            {isCurrentMonth ? dayNumber : ''}
                          </span>
                       </div>
                       {isCurrentMonth && dayTasks.length > 0 && (
                          <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full border shadow-sm ${hasHighPriority ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-800/80 border-slate-700/50'}`}>
                             <CheckSquare className={`w-2.5 h-2.5 ${hasHighPriority ? 'text-rose-500' : 'text-blue-500'}`} />
                             <span className={`text-[9px] font-black ${hasHighPriority ? 'text-rose-200' : 'text-slate-300'}`}>{dayTasks.length}</span>
                          </div>
                       )}
                    </div>
                    
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {dayEvents.length <= 4 ? (
                        dayEvents.map(event => {
                          const isBill = event.category === 'Bill';
                          const billStatus = isBill ? getBillStatus(event.date, !!event.isPaid) : null;
                          const billStyle = isBill ? (
                            billStatus === 'paid' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' :
                            billStatus === 'overdue' ? 'bg-rose-600 text-white border-rose-500 animate-pulse' :
                            billStatus === 'soon' ? 'bg-amber-500 text-amber-950 border-amber-400 font-black' :
                            'bg-slate-700 text-slate-300 border-slate-600'
                          ) : categoryColors[event.category];

                          return (
                            <div 
                              key={event.id} 
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold border-l-2 shadow-sm truncate transition-transform hover:scale-[1.02] flex items-center justify-between ${billStyle}`}
                            >
                              <div className="flex items-center min-w-0">
                                {isBill && <FileText className="w-2 h-2 mr-1 shrink-0" />}
                                <span className="truncate">{event.title}</span>
                              </div>
                              <div className="flex items-center shrink-0 ml-1">
                                {event.meetingLink && (
                                  <a 
                                    href={event.meetingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-0.5 hover:bg-white/20 rounded-sm mr-1"
                                  >
                                    <Video className="w-2 h-2" />
                                  </a>
                                )}
                                {event.travelTime && event.travelTime > 0 && (
                                  <Car className="w-2 h-2 mr-1 opacity-60" />
                                )}
                                {event.invitees && event.invitees.length > 0 && (
                                  <Users className="w-2 h-2 mr-1 text-blue-400" />
                                )}
                                {isBill && event.amount && (
                                  <span className="opacity-80 font-black">${event.amount}</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          {dayEvents.slice(0, 2).map(event => (
                            <div 
                              key={event.id} 
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black border-l-2 shadow-sm truncate ${categoryColors[event.category]}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          <div className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-black rounded-md text-center">
                            + {dayEvents.length - 2} more
                          </div>
                        </>
                      )}
                      
                      {dayEvents.length >= 5 && (
                         <div className="flex gap-1 mt-1 justify-center">
                            {dayEvents.map(e => (
                               <div key={e.id} className={`w-1 h-1 rounded-full ${categoryDots[e.category]}`}></div>
                            ))}
                         </div>
                      )}
                    </div>

                    {/* Bill Alert Badges */}
                    {isCurrentMonth && dayEvents.filter(e => e.category === 'Bill').map(bill => {
                      const badge = getBillBadge(bill.date, !!bill.isPaid);
                      if (!badge) return null;
                      return (
                        <div key={bill.id} className={`mt-1 px-1.5 py-0.5 rounded text-[7px] font-black text-white uppercase tracking-tighter self-start ${badge.color}`}>
                          {badge.text}
                        </div>
                      );
                    })}

                    {isToday && (
                       <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.8)] animate-pulse"></div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <AddEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        initialDate={selectedDate}
      />
    </div>
  );
}

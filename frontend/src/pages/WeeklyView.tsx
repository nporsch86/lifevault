import { ChevronLeft, ChevronRight, Plus, CheckSquare, Clock, Wallet, FileText, Check, Video, Car, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePlanner } from '../store/PlannerContext';
import type { PlannerEvent } from '../store/PlannerContext';
import AddEventModal from '../components/AddEventModal';
import HandwritingOverlay from '../components/HandwritingOverlay';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function WeeklyView() {
  const navigate = useNavigate();
  const { events, tasks, togglePaid, expenses, allDayEvents, addAllDayEvent } = usePlanner();

  const getCategoryColorClass = (catName: string) => {
    const standard: Record<string, string> = {
      Work: 'bg-blue-600/20 border-blue-600/40 text-blue-200',
      Personal: 'bg-emerald-600/20 border-emerald-600/40 text-emerald-200',
      Important: 'bg-rose-600/20 border-rose-600/40 text-rose-200',
      Confidential: 'bg-purple-600/20 border-purple-600/40 text-purple-200',
      Bill: 'bg-amber-500/20 border-amber-500/40 text-amber-200',
      Medical: 'bg-teal-600/20 border-teal-600/40 text-teal-200',
      Family: 'bg-indigo-600/20 border-indigo-600/40 text-indigo-200',
      Health: 'bg-cyan-600/20 border-cyan-600/40 text-cyan-200',
    };
    if (standard[catName]) return standard[catName];
    return 'bg-slate-800/40 border-slate-700/50 text-slate-300';
  };
  
  // Mock current week for development: Oct 27 - Nov 02, 2025
  const todayDateStr = '2025-10-29';
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [handwritingDate, setHandwritingDate] = useState<string | null>(null);

  const weekDates = [
    { label: '27', full: '2025-10-27' },
    { label: '28', full: '2025-10-28' },
    { label: '29', full: '2025-10-29' },
    { label: '30', full: '2025-10-30' },
    { label: '31', full: '2025-10-31' },
    { label: '01', full: '2025-11-01' },
    { label: '02', full: '2025-11-02' },
  ];
  
  const today = new Date(todayDateStr);

  const getDayStats = (dateStr: string) => {
    const dayTasks = tasks.filter(t => t.date === dateStr);
    return {
      count: dayTasks.length,
      completed: dayTasks.filter(t => t.completed).length
    };
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

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
              <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">Oct 27 – Nov 02, 2025</h2>
            </div>
            <button className="px-4 py-1.5 text-xs font-black bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 uppercase tracking-widest">
              This Week
            </button>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-1.5 text-sm font-bold text-slate-400 hover:text-slate-200 rounded-lg transition-all"
            >
              DAY
            </button>
            <button className="px-4 py-1.5 text-sm font-bold bg-slate-700 text-blue-600 rounded-lg shadow-sm">WEEK</button>
          </div>
        </div>

        {/* Week Stats Header */}
        <div className="flex items-center space-x-6 py-2 px-1 text-sm font-bold text-slate-500 border-b border-slate-800 pb-4">
          <span className="flex items-center"><CheckSquare className="w-4 h-4 mr-2 text-blue-600/50" /> {tasks.length} tasks total</span>
          <span className="flex items-center"><Clock className="w-4 h-4 mr-2 text-blue-600/50" /> {events.length} events scheduled</span>
          <span className="flex items-center"><Wallet className="w-4 h-4 mr-2 text-blue-600/50" /> $320.00 spent this week</span>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-4 flex-1 min-h-0 overflow-hidden">
        {DAYS.map((day, idx) => {
          const dateInfo = weekDates[idx];
          const isToday = dateInfo.full === todayDateStr;
          const dayEvents = events.filter(e => e.date === dateInfo.full);
          const dayAllDay = allDayEvents.filter(e => e.date === dateInfo.full);
          
          const billEvents: PlannerEvent[] = expenses
            .filter(ex => ex.dueDate === dateInfo.full)
            .map(ex => ({
              id: `bill-${ex.id}`,
              title: `${ex.note} Due`,
              date: ex.date,
              category: 'Bill',
              amount: ex.amount,
              isPaid: false,
              startTime: '09:00',
            }));

          const dayGridEvents: PlannerEvent[] = [...dayEvents, ...billEvents];
          const dayStats = getDayStats(dateInfo.full);

          return (
            <div key={day} className="flex flex-col space-y-4 min-w-0">
              {/* Day Header */}
              <div className={`text-center space-y-1 py-3 rounded-2xl transition-colors ${isToday ? 'bg-blue-600/10 border border-blue-600/20' : ''}`}>
                <p className={`text-[10px] font-black tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{day}</p>
                <p className={`text-2xl font-black ${isToday ? 'text-blue-600' : 'text-slate-100'}`}>{dateInfo.label}</p>
              </div>
              
              {/* Day Content */}
              <div 
                onPointerDown={(e) => {
                  if (e.pointerType === 'pen') {
                    e.preventDefault();
                    e.stopPropagation();
                    setHandwritingDate(dateInfo.full);
                  }
                }}
                className={`flex-1 rounded-[2rem] p-3 border transition-all flex flex-col space-y-3 relative group
                  ${isToday 
                    ? 'bg-blue-600/[0.03] border-blue-600/20 hover:border-blue-600/40' 
                    : 'bg-slate-800/20 border-slate-800/50 hover:border-slate-700'
                  }`}
                  >
                  {/* Handwriting Overlay */}
                  {handwritingDate === dateInfo.full && (
                    <div className="absolute inset-0 z-50">
                      <HandwritingOverlay 
                        onCancel={() => setHandwritingDate(null)}
                        onCapture={(text, dataUrl) => {
                          addAllDayEvent({
                            id: Math.random().toString(36).substr(2, 9),
                            title: text,
                            date: dateInfo.full,
                            category: 'Personal',
                            isHandwritten: true,
                            handwrittenData: dataUrl,
                          });
                          setHandwritingDate(null);
                        }}
                      />
                    </div>
                  )}
                  {/* All-Day Notes Bar */}
                  {dayAllDay.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-2 pb-2 border-b border-slate-800/50">
                    {dayAllDay.map(note => (
                      <div key={note.id} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-1.5 flex items-center space-x-2 shadow-sm">
                        <span className="text-[10px]">📌</span>
                        <div className="flex-1 min-w-0">
                          {note.handwrittenData ? (
                            <img src={note.handwrittenData} alt="Handwritten" className="h-5 object-contain brightness-200 contrast-125" />
                          ) : (
                            <p className="text-[9px] font-black text-slate-100 truncate">{note.title}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}

                  {/* Events dots/bars */}

                  {dayGridEvents.map(event => {
                    const isBill = event.category === 'Bill';
                    const billStatus = isBill ? getBillStatus(event.date, !!event.isPaid) : null;
                    const billStyle = isBill ? (
                      billStatus === 'paid' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' :
                      billStatus === 'overdue' ? 'bg-rose-600/20 border-rose-500/50 text-rose-200' :
                      billStatus === 'soon' ? 'bg-amber-500/40 border-amber-500/60 text-amber-50' :
                      'bg-slate-800/40 border-slate-700/50 text-slate-300'
                    ) : getCategoryColorClass(event.category);

                    return (
                      <div 
                        key={event.id} 
                        className={`p-2.5 rounded-xl border shadow-lg shadow-black/10 relative group/item transition-all ${billStyle}`}
                      >
                        <div className="mb-0.5">
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] font-black leading-tight truncate mr-1 flex-1">
                              {isBill && <FileText className="w-2.5 h-2.5 inline mr-1 mb-0.5" />}
                              {event.isHandwritten && event.handwrittenData ? (
                                <img src={event.handwrittenData} alt="Handwritten" className="h-6 object-contain brightness-200 contrast-125" />
                              ) : (
                                event.title
                              )}
                            </div>

                            {isBill && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); togglePaid(event.id); }}
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${event.isPaid ? 'bg-emerald-500 border-emerald-400' : 'border-slate-500/50 hover:border-blue-500'}`}
                              >
                                {event.isPaid && <Check className="w-3 h-3 text-white" />}
                              </button>
                            )}
                          </div>
                          {event.travelTime && event.travelTime > 0 && (
                            <div className="flex items-center text-[7px] font-black uppercase opacity-60 mt-1">
                              <Car className="w-2 h-2 mr-1" />
                              {event.travelTime}m travel
                            </div>
                          )}
                          {event.guests && event.guests.length > 0 && (
                            <div className="flex items-center text-[7px] font-black uppercase text-blue-400/70 mt-1">
                              <Users className="w-2 h-2 mr-1" />
                              {event.guests.length} Guests
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center text-[7px] font-black uppercase text-slate-500 mt-1">
                              <MapPin className="w-2 h-2 mr-1" />
                              Location Set
                            </div>
                          )}
                        </div>
                        {event.meetingLink && (
                          <a 
                            href={event.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1.5 flex items-center space-x-1 bg-white/5 hover:bg-white/10 p-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                          >
                            <Video className="w-2.5 h-2.5 text-blue-400" />
                            <span>Join</span>
                          </a>
                        )}
                        {isBill && event.amount && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[9px] font-black opacity-80">${event.amount}</span>
                            {!event.isPaid && (
                               <span className={`text-[7px] font-black uppercase px-1 rounded ${billStatus === 'overdue' ? 'bg-rose-500' : 'bg-slate-700'}`}>
                                 {billStatus}
                               </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {allDayEvents.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-6 h-6 text-slate-700" />
                    </div>
                  )}
                </div>

                {/* Task stats at bottom */}
                <div className="pt-3 border-t border-slate-800/50">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                      <span className={isToday ? 'text-blue-600/70' : 'text-slate-500'}>
                        {dayStats.count} Tasks
                      </span>
                      <span className="text-slate-600">{Math.round((dayStats.completed / dayStats.count) * 100) || 0}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isToday ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-slate-600'}`}
                        style={{ width: `${(dayStats.completed / dayStats.count) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 text-right">
                      {dayStats.completed} done
                    </p>
                  </div>
                </div>

                {/* Hover Plus button */}
                <button 
                  onClick={() => { setSelectedDate(dateInfo.full); setIsEventModalOpen(true); }}
                  className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-slate-700 transition-all border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
          );
        })}
      </div>

      <AddEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        initialDate={selectedDate}
      />
    </div>
  );
}

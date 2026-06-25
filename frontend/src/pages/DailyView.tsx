import { Plus, MoreVertical, CheckCircle2, Circle, Clock, CheckSquare, Wallet, FileText, Check, DollarSign, AlertCircle, Video, Car, Share2, Users, X, MapPin, ExternalLink } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { usePlanner } from '../store/PlannerContext';
import type { PlannerTask, PlannerEvent } from '../store/PlannerContext';
import AddEventModal from '../components/AddEventModal';
import VoiceInput from '../components/VoiceInput';
import HandwritingOverlay from '../components/HandwritingOverlay';
import { parseVoiceCommand } from '../utils/voiceParser';

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { label: `${displayHour} ${period}`, value: hour };
});

export default function DailyView() {
  const { events, tasks, budgets, toggleTask, addTask, togglePaid, addEvent, updateEvent, respondToInvite, categories, expenses, allDayEvents } = usePlanner();

  const getCategoryColorClass = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    if (cat) {
      // Since we use Tailwind, and dynamic arbitrary colors are tricky without a mapping or inline styles
      // We will fallback to a mapping if it matches, or use inline styles if necessary.
      // But let's check if the cat name is one of the standard ones.
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
      return 'bg-slate-600/20 border-slate-600/40 text-slate-200';
    }
    return 'bg-slate-600/20 border-slate-600/40 text-slate-200';
  };
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleVoiceCommand = (text: string) => {
    const parsed = parseVoiceCommand(text);
    
    if (parsed.action === 'add' && parsed.title && parsed.date) {
      addEvent({
        id: Math.random().toString(36).substr(2, 9),
        title: parsed.title,
        date: parsed.date,
        startTime: parsed.time || '09:00',
        category: 'Work',
      });
      // Optional: show a toast or feedback
      console.log(`Added event: ${parsed.title} on ${parsed.date} at ${parsed.time}`);
    } else if (parsed.action === 'move' && parsed.title && parsed.date) {
      const eventToMove = events.find(e => e.title.toLowerCase().includes(parsed.title!.toLowerCase()));
      if (eventToMove) {
        updateEvent(eventToMove.id, { date: parsed.date });
        console.log(`Moved event: ${eventToMove.title} to ${parsed.date}`);
      }
    }
  };

  // Mock spending data for alerts (in a real app, this would come from a global state or API)
  const mockSpending: Record<string, number> = {
    Food: 420.50,
    Transport: 180.00,
    Shopping: 310.00,
    Bills: 1450.00,
    Health: 50.00,
    Other: 20.00,
  };

  const budgetAlerts = budgets.map(b => {
    const spent = mockSpending[b.category] || 0;
    const percent = (spent / b.limit) * 100;
    if (percent >= 100) return { category: b.category, type: 'critical', text: `Budget Exceeded: ${b.category}` };
    if (percent >= 80) return { category: b.category, type: 'warning', text: `Approaching Limit: ${b.category}` };
    return null;
  }).filter(Boolean);
  
  // Mock today for development to match current month view
  const todayDateStr = '2025-10-29';
  const today = new Date(todayDateStr);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingEventId, setSharingEventId] = useState<string | null>(null);
  const [newInvitee, setNewInvitee] = useState('');
  const [inlineEvent, setInlineEvent] = useState<{ hour: number; title: string } | null>(null);
  const [handwritingHour, setHandwritingHour] = useState<number | null>(null);

  const todayTasks = tasks.filter(t => t.date === todayDateStr);
  const rolledOverTasks = tasks.filter(t => t.date < todayDateStr && !t.completed);
  const allVisibleTasks = [...rolledOverTasks, ...todayTasks];
  
  const todayEvents = events.filter(e => e.date === todayDateStr);
  const todayAllDay = allDayEvents.filter(e => e.date === todayDateStr);
  
  // Merge expenses with due dates into events for display
  const billEvents: PlannerEvent[] = expenses
    .filter(ex => ex.dueDate === todayDateStr)
    .map(ex => ({
      id: `bill-${ex.id}`,
      title: `${ex.note} Due`,
      date: ex.date,
      category: 'Bill',
      amount: ex.amount,
      isPaid: false, // in a real app, check if transaction exists
      startTime: '09:00', // Default bills to 9am
    }));

  const displayEvents: PlannerEvent[] = [...todayEvents, ...billEvents];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      date: todayDateStr,
      completed: false,
      priority: 'medium',
      category: 'Work',
    });
    setNewTaskTitle('');
  };

  const handleSlotClick = (e: React.PointerEvent, hour: number) => {
    if (e.pointerType === 'pen') {
      e.preventDefault();
      setHandwritingHour(hour);
      setInlineEvent(null);
      return;
    }

    if (inlineEvent) {
      saveInlineEvent();
    }
    setInlineEvent({ hour, title: '' });
  };

  const saveInlineEvent = () => {
    if (inlineEvent && inlineEvent.title.trim()) {
      addEvent({
        id: Math.random().toString(36).substr(2, 9),
        title: inlineEvent.title,
        date: todayDateStr,
        startTime: `${inlineEvent.hour.toString().padStart(2, '0')}:00`,
        category: 'Work',
      });
    }
    setInlineEvent(null);
  };

  const startEditing = (task: PlannerTask) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = (_id: string) => {
    setEditingTaskId(null);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const timeIndicatorTop = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours * 64) + (minutes / 60 * 64);
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

  const addInviteeToSharingEvent = () => {
    if (newInvitee && sharingEventId) {
      const event = events.find(e => e.id === sharingEventId);
      if (event && !event.guests?.some(g => g.email === newInvitee)) {
        updateEvent(sharingEventId, { 
          guests: [...(event.guests || []), { email: newInvitee, status: 'pending' }] 
        });
        setNewInvitee('');
      }
    }
  };

  const removeInviteeFromSharingEvent = (email: string) => {
    if (sharingEventId) {
      const event = events.find(e => e.id === sharingEventId);
      if (event) {
        updateEvent(sharingEventId, { 
          guests: event.guests?.filter(g => g.email !== email) 
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-8 gap-4">
        <div className="space-y-1">
          <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">{getGreeting()}</p>
          <h2 className="text-4xl font-black text-slate-100 tracking-tight">Wednesday, Oct 29</h2>
          <div className="flex items-center space-x-6 pt-2">
            <span className="flex items-center text-xs font-bold text-slate-500"><CheckSquare className="w-4 h-4 mr-2 text-blue-600/50" /> {todayTasks.filter(t => !t.completed).length} pending</span>
            <span className="flex items-center text-xs font-bold text-slate-500"><Clock className="w-4 h-4 mr-2 text-blue-600/50" /> {displayEvents.length} events</span>
            <span className="flex items-center text-xs font-bold text-slate-500"><Wallet className="w-4 h-4 mr-2 text-blue-600/50" /> $45.00</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <VoiceInput onCommand={handleVoiceCommand} />
          <div className="flex bg-slate-800 p-1 rounded-xl">
             <button className="px-4 py-1.5 text-sm font-bold bg-slate-700 text-blue-600 rounded-lg shadow-sm">DAY</button>
             <button className="px-4 py-1.5 text-sm font-bold text-slate-400 hover:text-slate-200 rounded-lg transition-all">WEEK</button>
          </div>
          <button 
            onClick={() => setIsEventModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center text-sm uppercase tracking-widest"
          >
            <Plus className="w-5 h-5 mr-1" /> New
          </button>
        </div>
      </div>

      {/* Focus & Alerts Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Focus Card */}
        <div className="flex-1 bg-blue-600 rounded-3xl p-6 text-slate-950 shadow-xl shadow-blue-600/10 relative overflow-hidden group min-h-[100px] flex items-center">
          <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <Clock className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h3 className="font-black text-sm mb-2 flex items-center tracking-tight uppercase tracking-widest">
              <span className="mr-3 text-xl">✨</span>
              Focus of the Day
            </h3>
            <p className="text-slate-900 text-sm leading-relaxed font-bold">
              Review the <span className="underline decoration-2 underline-offset-2">Quarterly Planning</span> before the end of the day. You're on track!
            </p>
          </div>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="flex flex-col gap-3 justify-center min-w-[300px]">
            {budgetAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`flex items-center p-4 rounded-2xl border ${alert?.type === 'critical' ? 'bg-rose-600/20 border-rose-500/50 text-rose-200' : 'bg-orange-600/10 border-orange-500/30 text-orange-200'} shadow-lg`}
              >
                <AlertCircle className={`w-5 h-5 mr-3 shrink-0 ${alert?.type === 'critical' ? 'text-rose-500' : 'text-orange-500'}`} />
                <p className="text-[10px] font-black uppercase tracking-widest">{alert?.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 flex-1 min-h-0">
        {/* Left Column: Schedule */}
        <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden flex flex-col h-[750px]">
          <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
            <h3 className="font-black text-slate-100 flex items-center tracking-tight text-xs uppercase tracking-widest">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Schedule
            </h3>
            <div className="flex items-center space-x-2 text-[10px] font-black text-slate-500">
               <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
               <span>LIVE</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
            {/* All Day Section */}
            <div className="flex border-b border-slate-800/50 mb-4 pb-4">
              <div className="w-20 pr-6 text-right text-[10px] font-black text-blue-500/50 uppercase tracking-tighter">
                All Day
              </div>
              <div className="flex-1 flex flex-wrap gap-3">
                {todayAllDay.map(note => (
                  <div key={note.id} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center space-x-3 min-w-[180px] shadow-sm">
                    <span className="text-lg">📌</span>
                    <div className="flex-1 min-w-0">
                      {note.handwrittenData ? (
                        <img src={note.handwrittenData} alt="Handwritten note" className="h-8 object-contain brightness-200 contrast-125" />
                      ) : (
                        <p className="text-xs font-black text-slate-100 truncate">{note.title}</p>
                      )}
                    </div>
                  </div>
                ))}
                {todayAllDay.length === 0 && (
                  <p className="text-[10px] font-bold text-slate-700 italic flex items-center">No all-day events</p>
                )}
              </div>
            </div>

            {/* Time Indicator */}
            <div 
              className="absolute left-20 right-0 border-t-2 border-blue-600/50 z-10 flex items-center"
              style={{ top: `${timeIndicatorTop() + 24}px` }}
            >
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full -ml-1 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
            </div>

            <div className="space-y-0">
              {HOURS.map((hour) => {
                const hourTasks = allVisibleTasks.filter(t => t.startTime && parseInt(t.startTime.split(':')[0]) === hour.value);
                
                return (
                <div key={hour.value} className="flex border-t border-slate-800/50 h-16 relative group">
                  <div className="w-20 pr-6 py-2 text-right text-[10px] font-black text-slate-600 select-none tracking-tighter relative">
                    {hour.label}
                    {hourTasks.length > 0 && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]" title={`${hourTasks.length} tasks at this hour`} />
                    )}
                  </div>
                  <div 
                    className="flex-1 py-1 group-hover:bg-slate-800/30 transition-colors relative cursor-pointer"
                    onPointerDown={(e) => handleSlotClick(e, hour.value)}
                  >
                    {handwritingHour === hour.value && (
                      <HandwritingOverlay 
                        hour={hour.value}
                        onCancel={() => setHandwritingHour(null)}
                        onCapture={(text, dataUrl) => {
                          addEvent({
                            id: Math.random().toString(36).substr(2, 9),
                            title: text,
                            date: todayDateStr,
                            startTime: `${hour.value.toString().padStart(2, '0')}:00`,
                            category: 'Personal',
                            isHandwritten: true,
                            handwrittenData: dataUrl,
                          });
                          setHandwritingHour(null);
                        }}
                      />
                    )}
                    {inlineEvent?.hour === hour.value && (
                      <div 
                        className="absolute inset-x-2 top-1 bottom-1 bg-blue-600/20 border border-blue-500 rounded-2xl p-4 z-30 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          autoFocus
                          type="text"
                          placeholder="Quick add event..."
                          className="w-full bg-transparent border-none focus:ring-0 text-sm font-black text-slate-100 placeholder:text-slate-500"
                          value={inlineEvent.title}
                          onChange={(e) => setInlineEvent({ ...inlineEvent, title: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveInlineEvent();
                            if (e.key === 'Escape') setInlineEvent(null);
                          }}
                          onBlur={saveInlineEvent}
                        />
                      </div>
                    )}
                    {displayEvents
                      .filter(e => {
                        if (e.startTime) return parseInt(e.startTime.split(':')[0]) === hour.value;
                        if (e.category === 'Bill') return hour.value === 9; // Show bills at 9am if no time
                        return false;
                      })
                      .map(event => {
                        const startMin = event.startTime ? parseInt(event.startTime.split(':')[1]) : 0;
                        const duration = 60;
                        const travelTime = event.travelTime || 0;
                        const isBill = event.category === 'Bill';
                        const billStatus = isBill ? getBillStatus(event.date, !!event.isPaid) : null;
                        const billStyle = isBill ? (
                          billStatus === 'paid' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' :
                          billStatus === 'overdue' ? 'bg-rose-600/30 border-rose-500/50 text-rose-200' :
                          'bg-amber-500/20 border-amber-500/40 text-amber-200'
                        ) : getCategoryColorClass(event.category);

                        return (
                          <React.Fragment key={event.id}>
                            {travelTime > 0 && (
                              <div 
                                className="absolute left-4 right-10 rounded-xl border border-dashed border-slate-600 bg-slate-800/40 flex items-center px-4 z-10"
                                onClick={(e) => e.stopPropagation()}
                                style={{ 
                                  top: `${((startMin - travelTime) / 60) * 100}%`, 
                                  height: `${(travelTime / 60) * 64 - 2}px`,
                                  minHeight: '20px'
                                }}
                              >
                                <div className="flex items-center space-x-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                  <Car className="w-3 h-3" />
                                  <span>{travelTime}m Travel Time</span>
                                </div>
                              </div>
                            )}
                            <div 
                              className={`absolute left-2 right-6 rounded-2xl border ${billStyle} p-4 shadow-xl shadow-black/20 z-20 cursor-pointer hover:scale-[1.01] transition-all flex justify-between items-start`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                top: `${(startMin / 60) * 100}%`, 
                                height: `${(duration / 60) * 64 - 4}px`,
                                minHeight: '60px'
                              }}
                            >
                            <div className="min-w-0 flex-1">
                              <div className="font-black text-sm truncate leading-tight flex items-center">
                                {isBill && <FileText className="w-4 h-4 mr-2 shrink-0" />}
                                {event.isHandwritten && event.handwrittenData ? (
                                  <img src={event.handwrittenData} alt="Handwritten" className="h-8 object-contain brightness-200 contrast-125" />
                                ) : (
                                  event.title
                                )}
                              </div>
                              <p className="text-[10px] font-bold opacity-60 mt-0.5 uppercase tracking-widest">
                                {isBill ? `Amount: ${event.amount}` : `${event.startTime} • ${duration} MIN`}
                              </p>
                              {event.location && (
                                <div className="mt-2 flex items-start space-x-2">
                                  <MapPin className="w-3 h-3 text-slate-400 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-300 leading-tight">{event.location}</p>
                                    {event.mapsLink && (
                                      <a 
                                        href={event.mapsLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[8px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 flex items-center mt-1"
                                      >
                                        Open Maps <ExternalLink className="w-2 h-2 ml-1" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                              {event.meetingLink && (
                                <a 
                                  href={event.meetingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2 inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                  <Video className="w-3 h-3 text-blue-400" />
                                  <span>Join Meeting</span>
                                </a>
                              )}

                              {event.guests && event.guests.length > 0 && (
                                <div className="mt-3 flex items-center space-x-2">
                                  <div className="flex -space-x-2">
                                    {event.guests.slice(0, 3).map((guest, i) => (
                                      <div key={i} className="w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[8px] font-black uppercase text-blue-400 relative">
                                        {guest.email[0]}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-800 ${
                                          guest.status === 'accepted' ? 'bg-emerald-500' :
                                          guest.status === 'declined' ? 'bg-rose-500' :
                                          'bg-slate-500'
                                        }`}></div>
                                      </div>
                                    ))}
                                    {event.guests.length > 3 && (
                                      <div className="w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[8px] font-black text-slate-300">
                                        +{event.guests.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{event.guests.length} GUESTS</span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSharingEventId(event.id); setIsShareModalOpen(true); }}
                                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-blue-400 transition-colors"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {!event.guests && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSharingEventId(event.id); setIsShareModalOpen(true); }}
                                  className="mt-3 flex items-center space-x-2 text-[9px] font-black uppercase text-slate-500 hover:text-blue-400 transition-colors"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>Share / Invite</span>
                                </button>
                              )}

                              {event.inviteStatus === 'pending' && (
                                <div className="mt-3 flex items-center space-x-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); respondToInvite(event.id, 'accepted'); }}
                                    className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-emerald-500 transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); respondToInvite(event.id, 'declined'); }}
                                    className="px-3 py-1 bg-slate-700 text-slate-300 text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-slate-600 transition-colors"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                            {isBill && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); togglePaid(event.id); }}
                                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${event.isPaid ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800 border-slate-700 hover:border-blue-500'}`}
                              >
                                {event.isPaid ? <Check className="w-4 h-4 text-white" /> : <DollarSign className="w-3 h-3 text-slate-500" />}
                              </button>
                            )}
                          </div>
                        </React.Fragment>
                        );
                      })
                    }
                  </div>
                </div>
              );})}
            </div>
          </div>
        </div>

        {/* Right Column: Tasks integrated alongside */}
        <div className="flex flex-col min-h-0">
          {/* Tasks Panel */}
          <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden flex flex-col h-[750px]">
            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-blue-600/5">
              <h3 className="font-black text-slate-100 tracking-tight text-xs uppercase tracking-widest flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-blue-500" />
                Today's Tasks
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-slate-500 uppercase">{allVisibleTasks.filter(t => !t.completed).length} REMAINING</span>
              </div>
            </div>
            
            <div className="p-6 border-b border-slate-800/50">
              <form onSubmit={handleAddTask}>
                <div className="relative">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Quick add task..."
                    className="w-full pl-5 pr-12 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:bg-slate-800 transition-all font-bold text-slate-100 placeholder:text-slate-600"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-3 p-1.5 text-blue-600 hover:bg-blue-600/10 rounded-xl transition-all"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {allVisibleTasks.map((task) => {
                const isRolledOver = task.date < todayDateStr;
                
                return (
                <div 
                  key={task.id} 
                  className={`group flex items-center p-4 rounded-2xl border transition-all ${
                    task.completed ? 'bg-slate-800/30 border-transparent opacity-40' : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-600/30 hover:shadow-lg shadow-black/20'
                  }`}
                >
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className="mr-4 text-slate-600 hover:text-blue-600 transition-all shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0 mr-4">
                    {editingTaskId === task.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => saveEdit(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                        autoFocus
                        className="w-full text-sm font-black border-b-2 border-blue-600 focus:outline-none bg-transparent py-1 text-slate-100"
                      />
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <p 
                            className={`text-sm font-black truncate cursor-text ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}
                            onClick={() => startEditing(task)}
                          >
                            {task.title}
                          </p>
                          {isRolledOver && !task.completed && (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[8px] font-black rounded uppercase tracking-tighter shrink-0" title="Rolled over from yesterday">Rollover</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-1.5">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            task.category === 'Work' ? 'text-blue-500/60' :
                            task.category === 'Personal' ? 'text-emerald-500/60' :
                            'text-slate-500/60'
                          }`}>
                            {task.category}
                          </span>
                          {task.startTime && (
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                              <Clock className="w-3 h-3 mr-1" /> {task.startTime}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                      task.priority === 'high' ? 'bg-rose-500/20 text-red-400' : 
                      task.priority === 'medium' ? 'bg-blue-600/20 text-blue-50' : 
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {task.priority[0].toUpperCase()}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                    </button>
                  </div>
                </div>
                );
              })}
              {allVisibleTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2 opacity-50">
                  <CheckSquare className="w-12 h-12" />
                  <p className="text-xs font-black uppercase tracking-widest">No tasks for today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        initialDate={todayDateStr}
      />

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#16191e] w-full max-w-md rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-100 tracking-tight uppercase tracking-widest">Share Event</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Invite Guests</label>
                <div className="flex space-x-2 mb-3">
                  <div className="relative flex-1">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      placeholder="email@example.com"
                      value={newInvitee}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-sm"
                      onChange={(e) => setNewInvitee(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInviteeToSharingEvent())}
                    />
                  </div>
                  <button 
                    onClick={addInviteeToSharingEvent}
                    className="bg-slate-800 border border-slate-700/50 p-4 rounded-2xl text-blue-500 hover:bg-slate-700 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {events.find(e => e.id === sharingEventId)?.guests?.map(guest => (
                    <div key={guest.email} className="bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-3 flex items-center justify-between group">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500 uppercase relative">
                          {guest.email[0]}
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#16191e] ${
                            guest.status === 'accepted' ? 'bg-emerald-500' :
                            guest.status === 'declined' ? 'bg-rose-500' :
                            'bg-slate-500'
                          }`}></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-300">{guest.email}</span>
                          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{guest.status}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeInviteeFromSharingEvent(guest.email)}
                        className="text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!events.find(e => e.id === sharingEventId)?.guests || events.find(e => e.id === sharingEventId)?.guests?.length === 0) && (
                    <p className="text-[10px] font-bold text-slate-600 text-center py-4 uppercase tracking-widest">No guests invited yet</p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

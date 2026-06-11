import { Plus, MoreVertical, CheckCircle2, Circle, Clock, CheckSquare, Wallet, FileText, Check, DollarSign, AlertCircle, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePlanner } from '../store/PlannerContext';
import type { PlannerTask } from '../store/PlannerContext';
import AddEventModal from '../components/AddEventModal';

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { label: `${displayHour} ${period}`, value: hour };
});

const categoryColors: Record<string, string> = {
  Work: 'bg-blue-600/20 border-blue-600/40 text-blue-200',
  Personal: 'bg-emerald-600/20 border-emerald-600/40 text-emerald-200',
  Important: 'bg-rose-600/20 border-rose-600/40 text-rose-200',
  Confidential: 'bg-purple-600/20 border-purple-600/40 text-purple-200',
  Bill: 'bg-amber-500/20 border-amber-500/40 text-amber-200',
  Medical: 'bg-teal-600/20 border-teal-600/40 text-teal-200',
  Family: 'bg-indigo-600/20 border-indigo-600/40 text-indigo-200',
  Health: 'bg-cyan-600/20 border-cyan-600/40 text-cyan-200',
};

export default function DailyView() {
  const { events, tasks, budgets, toggleTask, addTask, togglePaid } = usePlanner();
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const todayTasks = tasks.filter(t => t.date === todayDateStr);
  const todayEvents = events.filter(e => e.date === todayDateStr);

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

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-8 gap-4">
        <div className="space-y-1">
          <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">{getGreeting()}</p>
          <h2 className="text-4xl font-black text-slate-100 tracking-tight">Wednesday, Oct 29</h2>
          <div className="flex items-center space-x-6 pt-2">
            <span className="flex items-center text-xs font-bold text-slate-500"><CheckSquare className="w-4 h-4 mr-2 text-blue-600/50" /> {todayTasks.filter(t => !t.completed).length} pending</span>
            <span className="flex items-center text-xs font-bold text-slate-500"><Clock className="w-4 h-4 mr-2 text-blue-600/50" /> {todayEvents.length} events</span>
            <span className="flex items-center text-xs font-bold text-slate-500"><Wallet className="w-4 h-4 mr-2 text-blue-600/50" /> $45.00</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 min-h-0">
        {/* Left Column: Schedule */}
        <div className="lg:col-span-2 bg-[#16191e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden flex flex-col h-[750px]">
          <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
            <h3 className="font-black text-slate-100 flex items-center tracking-tight text-sm uppercase">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Schedule
            </h3>
            <div className="flex items-center space-x-2 text-[10px] font-black text-slate-500">
               <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
               <span>LIVE</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
            {/* Time Indicator */}
            <div 
              className="absolute left-20 right-0 border-t-2 border-blue-600/50 z-10 flex items-center"
              style={{ top: `${timeIndicatorTop() + 24}px` }}
            >
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full -ml-1 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
            </div>

            <div className="space-y-0">
              {HOURS.map((hour) => (
                <div key={hour.value} className="flex border-t border-slate-800/50 h-16 relative group">
                  <div className="w-20 pr-6 py-2 text-right text-[10px] font-black text-slate-600 select-none tracking-tighter">
                    {hour.label}
                  </div>
                  <div className="flex-1 py-1 group-hover:bg-slate-800/30 transition-colors relative">
                    {todayEvents
                      .filter(e => {
                        if (e.startTime) return parseInt(e.startTime.split(':')[0]) === hour.value;
                        if (e.category === 'Bill') return hour.value === 9; // Show bills at 9am if no time
                        return false;
                      })
                      .map(event => {
                        const startMin = event.startTime ? parseInt(event.startTime.split(':')[1]) : 0;
                        const duration = 60;
                        const isBill = event.category === 'Bill';
                        const billStatus = isBill ? getBillStatus(event.date, !!event.isPaid) : null;
                        const billStyle = isBill ? (
                          billStatus === 'paid' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' :
                          billStatus === 'overdue' ? 'bg-rose-600/30 border-rose-500/50 text-rose-200' :
                          'bg-amber-500/20 border-amber-500/40 text-amber-200'
                        ) : categoryColors[event.category];

                        return (
                          <div 
                            key={event.id}
                            className={`absolute left-2 right-6 rounded-2xl border ${billStyle} p-4 shadow-xl shadow-black/20 z-20 cursor-pointer hover:scale-[1.01] transition-all flex justify-between items-start`}
                            style={{ 
                              top: `${(startMin / 60) * 100}%`, 
                              height: `${(duration / 60) * 64 - 4}px`,
                              minHeight: '60px'
                            }}
                          >
                            <div className="min-w-0">
                              <p className="font-black text-sm truncate leading-tight flex items-center">
                                {isBill && <FileText className="w-4 h-4 mr-2 shrink-0" />}
                                {event.title}
                              </p>
                              <p className="text-[10px] font-bold opacity-60 mt-0.5 uppercase tracking-widest">
                                {isBill ? `Amount: ${event.amount}` : `${event.startTime} • ${duration} MIN`}
                              </p>
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
                        );
                      })
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Panels */}
        <div className="space-y-8 flex flex-col min-h-0">
          {/* Focus Card */}
          <div className="bg-blue-600 rounded-3xl p-8 text-slate-950 shadow-xl shadow-blue-600/10 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Clock className="w-48 h-48" />
            </div>
            <h3 className="font-black text-xl mb-4 flex items-center relative z-10 tracking-tight">
              <span className="mr-3 text-2xl">✨</span>
              FOCUS OF THE DAY
            </h3>
            <p className="text-slate-900 text-sm leading-relaxed relative z-10 font-bold">
              Review the <span className="underline decoration-2 underline-offset-2">Quarterly Planning</span> before the end of the day. You're on track for a productive day!
            </p>
          </div>

          {/* Budget Alerts Panel */}
          {budgetAlerts.length > 0 && (
            <div className="space-y-3">
              {budgetAlerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center p-4 rounded-2xl border ${alert?.type === 'critical' ? 'bg-rose-600/20 border-rose-500/50 text-rose-200' : 'bg-orange-600/10 border-orange-500/30 text-orange-200'} shadow-lg animate-in slide-in-from-right duration-500`}
                >
                  <AlertCircle className={`w-5 h-5 mr-3 shrink-0 ${alert?.type === 'critical' ? 'text-rose-500' : 'text-orange-500'}`} />
                  <p className="text-xs font-black uppercase tracking-widest">{alert?.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tasks Panel */}
          <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
              <h3 className="font-black text-slate-100 tracking-tight text-xs uppercase tracking-widest">Today's Tasks</h3>
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              </div>
            </div>
            
            <div className="p-6 border-b border-slate-800/50">
              <form onSubmit={handleAddTask}>
                <div className="relative">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a task..."
                    className="w-full pl-5 pr-12 py-3.5 bg-slate-800 border border-slate-700/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:bg-slate-800 transition-all font-bold text-slate-100 placeholder:text-slate-600"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-2.5 p-1.5 text-blue-600 hover:bg-blue-600/10 rounded-xl transition-all"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {todayTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`group flex items-center p-4 rounded-2xl border transition-all ${
                    task.completed ? 'bg-slate-800/50 border-transparent opacity-50' : 'bg-slate-800 border-slate-700/50 hover:border-blue-600/30 hover:shadow-lg shadow-black/20'
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
                        <p 
                          className={`text-sm font-black truncate cursor-text ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}
                          onClick={() => startEditing(task)}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center space-x-3 mt-1.5">
                          <span className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">
                            {task.category}
                          </span>
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
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        initialDate={todayDateStr}
      />
    </div>
  );
}

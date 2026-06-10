import { Plus, MoreVertical, CheckCircle2, Circle, Clock, CheckSquare, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'H' | 'M' | 'L';
  category: 'Work' | 'Personal' | 'Family' | 'Health';
  rolledOver?: boolean;
}

interface Event {
  id: string;
  title: string;
  start: string; // "HH:mm"
  duration: number; // minutes
  category: 'Work' | 'Personal' | 'Family' | 'Health';
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { label: `${displayHour} ${period}`, value: hour };
});

const categoryColors: Record<string, string> = {
  Work: 'bg-blue-500/20 border-blue-500/50 text-blue-200',
  Personal: 'bg-green-500/20 border-green-500/50 text-green-200',
  Family: 'bg-orange-500/20 border-orange-500/50 text-orange-200',
  Health: 'bg-red-500/20 border-red-500/50 text-red-200',
};

export default function DailyView() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Finish budget report', completed: false, priority: 'H', category: 'Work' },
    { id: '2', title: 'Call John', completed: false, priority: 'M', category: 'Personal' },
    { id: '3', title: 'Submit report', completed: false, priority: 'H', category: 'Work', rolledOver: true },
    { id: '4', title: 'Buy groceries', completed: true, priority: 'L', category: 'Personal' },
  ]);

  const [events] = useState<Event[]>([
    { id: 'e1', title: 'Product Sync', start: '09:00', duration: 60, category: 'Work' },
    { id: 'e2', title: 'Lunch with Team', start: '13:00', duration: 90, category: 'Personal' },
    { id: 'e3', title: 'Gym Session', start: '17:30', duration: 60, category: 'Health' },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      completed: false,
      priority: 'M',
      category: 'Work',
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, title: editingTitle } : t));
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

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-8 gap-4">
        <div className="space-y-1">
          <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">{getGreeting()}</p>
          <h2 className="text-4xl font-black text-slate-100 tracking-tight">Tuesday, May 7</h2>
          <div className="flex items-center space-x-6 pt-2">
            <span className="flex items-center text-xs font-bold text-slate-500"><CheckSquare className="w-4 h-4 mr-2 text-blue-600/50" /> {tasks.filter(t => !t.completed).length} pending</span>
            <span className="flex items-center text-xs font-bold text-slate-500"><Clock className="w-4 h-4 mr-2 text-blue-600/50" /> {events.length} events</span>
            <span className="flex items-center text-xs font-bold text-slate-500"><Wallet className="w-4 h-4 mr-2 text-blue-600/50" /> $45.00</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-slate-800 p-1 rounded-xl">
             <button className="px-4 py-1.5 text-sm font-bold bg-slate-700 text-blue-600 rounded-lg shadow-sm">DAY</button>
             <button className="px-4 py-1.5 text-sm font-bold text-slate-400 hover:text-slate-200 rounded-lg transition-all">WEEK</button>
          </div>
          <button className="bg-blue-600 text-slate-950 px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center text-sm">
            <Plus className="w-5 h-5 mr-1" /> NEW
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 min-h-0">
        {/* Left Column: Schedule */}
        <div className="lg:col-span-2 bg-[#16191e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden flex flex-col h-[750px]">
          <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
            <h3 className="font-black text-slate-100 flex items-center tracking-tight">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              SCHEDULE
            </h3>
            <div className="flex items-center space-x-2 text-xs font-black text-slate-500">
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
                    {events
                      .filter(e => parseInt(e.start.split(':')[0]) === hour.value)
                      .map(event => {
                        const startMin = parseInt(event.start.split(':')[1]);
                        return (
                          <div 
                            key={event.id}
                            className={`absolute left-2 right-6 rounded-2xl border ${categoryColors[event.category]} p-4 shadow-xl shadow-black/20 z-20 cursor-pointer hover:scale-[1.01] transition-all`}
                            style={{ 
                              top: `${(startMin / 60) * 100}%`, 
                              height: `${(event.duration / 60) * 64 - 4}px`,
                              minHeight: '44px'
                            }}
                          >
                            <p className="font-black text-sm truncate leading-tight">{event.title}</p>
                            <p className="text-[10px] font-bold opacity-60 mt-0.5">
                              {event.start} • {event.duration} MIN
                            </p>
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
              Review the <span className="underline decoration-2 underline-offset-2">Budget Report</span> before the 2 PM sync. You're on track for a productive day!
            </p>
          </div>

          {/* Tasks Panel */}
          <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
              <h3 className="font-black text-slate-100 tracking-tight">TODAY'S TASKS</h3>
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              </div>
            </div>
            
            <div className="p-6 border-b border-slate-800/50">
              <form onSubmit={addTask}>
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
              {tasks.map((task) => (
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
                          {task.rolledOver && (
                            <span className="text-[9px] text-orange-500 font-black flex items-center tracking-widest">
                              <Clock className="w-3 h-3 mr-1" /> ROLLED
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                      task.priority === 'H' ? 'bg-red-500/20 text-red-400' : 
                      task.priority === 'M' ? 'bg-blue-600/20 text-blue-500' : 
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {task.priority}
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
    </div>
  );
}

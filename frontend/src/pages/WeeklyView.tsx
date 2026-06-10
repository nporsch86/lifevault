import { ChevronLeft, ChevronRight, Plus, CheckSquare, Clock, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  category: 'Work' | 'Personal' | 'Family' | 'Health';
  day: number;
}

interface DayStats {
  tasksCount: number;
  tasksCompleted: number;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DATES = [11, 12, 13, 14, 15, 16, 17];
const CURRENT_DAY_INDEX = 5; // SAT, May 16

const categoryColors: Record<string, string> = {
  Work: 'bg-blue-500/20 border-blue-500/50 text-blue-200',
  Personal: 'bg-green-500/20 border-green-500/50 text-green-200',
  Family: 'bg-orange-500/20 border-orange-500/50 text-orange-200',
  Health: 'bg-red-500/20 border-red-500/50 text-red-200',
};

export default function WeeklyView() {
  const navigate = useNavigate();
  const [events] = useState<Event[]>([
    { id: '1', title: 'Team Sync', category: 'Work', day: 0 },
    { id: '2', title: 'Gym', category: 'Health', day: 0 },
    { id: '3', title: 'Project Draft', category: 'Work', day: 2 },
    { id: '4', title: 'Client Call', category: 'Work', day: 3 },
    { id: '5', title: "Doctor", category: 'Health', day: 4 },
    { id: '6', title: 'Dinner', category: 'Family', day: 4 },
    { id: '7', title: 'Groceries', category: 'Family', day: 5 },
    { id: '8', title: 'Laundry', category: 'Personal', day: 6 },
  ]);

  const [stats] = useState<Record<number, DayStats>>({
    0: { tasksCount: 5, tasksCompleted: 3 },
    1: { tasksCount: 3, tasksCompleted: 3 },
    2: { tasksCount: 8, tasksCompleted: 2 },
    3: { tasksCount: 4, tasksCompleted: 1 },
    4: { tasksCount: 6, tasksCompleted: 0 },
    5: { tasksCount: 2, tasksCompleted: 0 },
    6: { tasksCount: 1, tasksCompleted: 0 },
  });

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
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">Week 20, May 11–17, 2026</h2>
            </div>
            <button className="px-4 py-1.5 text-xs font-black bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">
              THIS WEEK
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
          <span className="flex items-center"><CheckSquare className="w-4 h-4 mr-2 text-blue-600/50" /> 29 tasks total</span>
          <span className="flex items-center"><Clock className="w-4 h-4 mr-2 text-blue-600/50" /> 8 events scheduled</span>
          <span className="flex items-center"><Wallet className="w-4 h-4 mr-2 text-blue-600/50" /> $320.00 spent this week</span>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-4 flex-1 min-h-0 overflow-hidden">
        {DAYS.map((day, idx) => (
          <div key={day} className="flex flex-col space-y-4 min-w-0">
            {/* Day Header */}
            <div className={`text-center space-y-1 py-3 rounded-2xl transition-colors ${idx === CURRENT_DAY_INDEX ? 'bg-blue-600/10 border border-blue-600/20' : ''}`}>
              <p className={`text-[10px] font-black tracking-widest ${idx === CURRENT_DAY_INDEX ? 'text-blue-600' : 'text-slate-500'}`}>{day}</p>
              <p className={`text-2xl font-black ${idx === CURRENT_DAY_INDEX ? 'text-blue-600' : 'text-slate-100'}`}>{DATES[idx]}</p>
            </div>
            
            {/* Day Content */}
            <div 
              onClick={() => navigate('/')}
              className={`flex-1 rounded-3xl p-3 border transition-all cursor-pointer flex flex-col space-y-3 relative group
                ${idx === CURRENT_DAY_INDEX 
                  ? 'bg-blue-600/[0.03] border-blue-600/20 hover:border-blue-600/40' 
                  : 'bg-slate-800/20 border-slate-800/50 hover:border-slate-700'
                }`}
            >
              {/* Events dots/bars */}
              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {events.filter(e => e.day === idx).map(event => (
                  <div 
                    key={event.id} 
                    className={`p-2.5 rounded-xl border ${categoryColors[event.category]} shadow-lg shadow-black/10`}
                  >
                    <p className="text-[11px] font-black leading-tight truncate">{event.title}</p>
                  </div>
                ))}
                
                {events.filter(e => e.day === idx).length === 0 && (
                  <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-6 h-6 text-slate-700" />
                  </div>
                )}
              </div>

              {/* Task stats at bottom */}
              <div className="pt-3 border-t border-slate-800/50">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className={idx === CURRENT_DAY_INDEX ? 'text-blue-600/70' : 'text-slate-500'}>
                      {stats[idx].tasksCount} Tasks
                    </span>
                    <span className="text-slate-600">{Math.round((stats[idx].tasksCompleted / stats[idx].tasksCount) * 100) || 0}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${idx === CURRENT_DAY_INDEX ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-slate-600'}`}
                      style={{ width: `${(stats[idx].tasksCompleted / stats[idx].tasksCount) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-600 text-right">
                    {stats[idx].tasksCompleted} done
                  </p>
                </div>
              </div>

              {/* Hover Plus button */}
              <button className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-slate-700 transition-all border border-slate-700">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

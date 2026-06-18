import { Plus, CheckCircle2, Circle, Clock, Flag, CalendarDays } from 'lucide-react';
import { useState, useMemo } from 'react';
import { usePlanner } from '../store/PlannerContext';
import type { PlannerTask } from '../store/PlannerContext';

const priorityColors: Record<string, string> = {
  high: 'text-rose-400 bg-rose-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  low: 'text-slate-400 bg-slate-500/10',
};

const categoryColors: Record<string, string> = {
  Work: 'bg-blue-600/20 text-blue-300',
  Personal: 'bg-emerald-600/20 text-emerald-300',
  Health: 'bg-rose-600/20 text-rose-300',
  Family: 'bg-orange-600/20 text-orange-300',
  Finance: 'bg-amber-600/20 text-amber-300',
};

export default function Tasks() {
  const { tasks, addTask, toggleTask } = usePlanner();
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'done'>('active');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'category'>('date');

  const today = new Date().toISOString().split('T')[0];

  const todayTasks = tasks.filter(t => t.date === today);
  const pendingToday = todayTasks.filter(t => !t.completed).length;

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (filterStatus === 'active') filtered = filtered.filter(t => !t.completed);
    else if (filterStatus === 'done') filtered = filtered.filter(t => t.completed);

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') return b.date.localeCompare(a.date);
      if (sortBy === 'priority') {
        const p = { high: 0, medium: 1, low: 2 };
        return p[a.priority] - p[b.priority];
      }
      return a.category.localeCompare(b.category);
    });
  }, [tasks, filterStatus, sortBy]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask({
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle.trim(),
      date: newDate,
      completed: false,
      priority: newPriority,
      category: newCategory,
    });
    setNewTitle('');
    setShowAdd(false);
  };

  const priorityLabel = (p: string) => {
    switch(p) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      default: return 'Low';
    }
  };

  const groupByDate = (taskList: PlannerTask[]) => {
    const groups: Record<string, PlannerTask[]> = {};
    taskList.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  };

  const isOverdue = (date: string) => date < today;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">Tasks</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {pendingToday > 0 ? `${pendingToday} pending today` : 'All caught up! 🎉'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-[#16191e] rounded-3xl border border-slate-800/50 p-6 space-y-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            autoFocus
          />
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Priority</label>
              <div className="flex space-x-2">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                      newPriority === p 
                        ? priorityColors[p] + ' ring-1 ring-white/20'
                        : 'text-slate-600 bg-slate-800/50 hover:text-slate-400'
                    }`}
                  >
                    <Flag className="w-3 h-3 inline mr-1" />
                    {priorityLabel(p)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option>Personal</option>
                <option>Work</option>
                <option>Health</option>
                <option>Family</option>
                <option>Finance</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all">Add Task</button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {(['active', 'all', 'done'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                filterStatus === status
                  ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {status === 'active' ? 'Active' : status === 'done' ? 'Done' : 'All'}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span>Sort:</span>
          {(['date', 'priority', 'category'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-1 rounded ${
                sortBy === s ? 'text-blue-400 bg-blue-600/10' : 'hover:text-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No tasks found</p>
          <button onClick={() => setShowAdd(true)} className="text-blue-500 text-sm font-bold mt-2 hover:text-blue-400 transition-colors">Create one</button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupByDate(filteredTasks).map(([date, dateTasks]) => (
            <div key={date}>
              <div className="flex items-center space-x-3 mb-3">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  {date === today ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                {isOverdue(date) && (
                  <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase">Overdue</span>
                )}
              </div>
              <div className="space-y-2">
                {dateTasks.map(task => (
                  <div
                    key={task.id}
                    className={`bg-[#16191e] border ${task.completed ? 'border-slate-800/30 opacity-60' : 'border-slate-800/50'} rounded-2xl transition-all hover:border-slate-700/50`}
                  >
                    <div className="flex items-center p-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`mr-4 transition-all ${task.completed ? 'text-emerald-500' : 'text-slate-600 hover:text-blue-500'}`}
                      >
                        {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm ${task.completed ? 'line-through text-slate-600' : 'text-slate-100'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                            <Flag className="w-3 h-3 inline mr-0.5" />
                            {priorityLabel(task.priority)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[task.category] || 'bg-slate-700/50 text-slate-400'}`}>
                            {task.category}
                          </span>
                          {task.startTime && (
                            <span className="text-[10px] font-bold text-slate-500 flex items-center">
                              <Clock className="w-3 h-3 mr-0.5" /> {task.startTime}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="ml-2 p-2 text-slate-600 hover:text-blue-500 transition-colors"
                      >
                        {task.completed ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
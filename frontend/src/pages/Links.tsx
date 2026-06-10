import { useState } from 'react';
import { 
  Link as LinkIcon, 
  Plus, 
  Bell, 
  ExternalLink, 
  Search, 
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface SavedLink {
  id: string;
  title: string;
  url: string;
  notes: string;
  alertAt: string | null;
  category: string;
  isCompleted: boolean;
}

export default function Links() {
  const [links, setStashedLinks] = useState<SavedLink[]>([
    { 
      id: '1', 
      title: 'Project Roadmap 2025', 
      url: 'https://docs.google.com/roadmap', 
      notes: 'Contains the quarterly goals and budget.', 
      alertAt: '2025-10-25T10:00',
      category: 'Work',
      isCompleted: false
    },
    { 
      id: '2', 
      title: 'Fitness Tracker Setup', 
      url: 'https://fitness.app/setup', 
      notes: 'Need to sync with my Apple Watch.', 
      alertAt: '2025-10-18T08:00',
      category: 'Health',
      isCompleted: true
    },
    { 
      id: '3', 
      title: 'Wedding Gift Ideas', 
      url: 'https://amazon.com/wishlist', 
      notes: 'For Sarah and Tom.', 
      alertAt: null,
      category: 'Personal',
      isCompleted: false
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    notes: '',
    alertAt: '',
    category: 'Work'
  });

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.url || !newLink.title) return;
    const link: SavedLink = {
      id: Math.random().toString(36).substr(2, 9),
      ...newLink,
      alertAt: newLink.alertAt || null,
      isCompleted: false
    };
    setStashedLinks([link, ...links]);
    setNewLink({ title: '', url: '', notes: '', alertAt: '', category: 'Work' });
    setIsAdding(false);
  };

  const toggleComplete = (id: string) => {
    setStashedLinks(links.map(l => l.id === id ? { ...l, isCompleted: !l.isCompleted } : l));
  };

  const deleteLink = (id: string) => {
    setStashedLinks(links.filter(l => l.id !== id));
  };

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-8 gap-4">
        <div className="space-y-1">
          <p className="text-blue-500 font-black text-xs uppercase tracking-[0.2em]">Smart Stash</p>
          <h2 className="text-4xl font-black text-slate-100 tracking-tight">Links & Alerts</h2>
          <p className="text-sm font-bold text-slate-500">Save resources and set smart reminders.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center text-sm"
          >
            <Plus className="w-5 h-5 mr-1" /> ADD LINK
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 min-h-0">
        {/* Left Column: Link List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search your links..."
              className="w-full bg-[#16191e] border border-slate-800/50 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-bold text-slate-100 placeholder:text-slate-600"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {links.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase())).map(link => (
              <div 
                key={link.id}
                className={`bg-[#16191e] rounded-3xl border border-slate-800/50 p-6 shadow-xl transition-all group hover:border-blue-600/30 ${link.isCompleted ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <button 
                      onClick={() => toggleComplete(link.id)}
                      className={`mt-1 transition-all ${link.isCompleted ? 'text-blue-500' : 'text-slate-700 hover:text-blue-500'}`}
                    >
                      {link.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-current" />}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-lg font-black tracking-tight ${link.isCompleted ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-blue-400'}`}>
                          {link.title}
                        </h3>
                        <span className="text-[10px] font-black text-slate-500 px-2 py-0.5 bg-slate-800 rounded-lg uppercase tracking-widest">
                          {link.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <LinkIcon className="w-3 h-3 text-blue-500/50" />
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-500 hover:underline truncate max-w-[250px]">
                          {link.url}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-slate-600 hover:bg-slate-800 rounded-xl transition-all">
                       <ExternalLink className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteLink(link.id)} className="p-2 text-slate-600 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pl-10">
                   <p className="text-sm font-medium text-slate-400 leading-relaxed italic">"{link.notes}"</p>
                   
                   {link.alertAt && (
                     <div className={`mt-4 flex items-center space-x-2 px-3 py-1.5 rounded-lg w-fit ${link.isCompleted ? 'bg-slate-800/50 text-slate-600' : 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_10px_rgba(37,99,235,0.05)]'}`}>
                        <Bell className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Alert: {new Date(link.alertAt).toLocaleString()}</span>
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Alerts Summary & Add Form */}
        <div className="space-y-8">
           {/* Add Link Form overlay-style */}
           {isAdding && (
             <div className="bg-[#16191e] rounded-3xl border-2 border-blue-600/50 shadow-2xl p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between">
                   <h3 className="font-black text-slate-100 tracking-tight flex items-center">
                      <Plus className="w-5 h-5 mr-2 text-blue-500" />
                      NEW STASH ITEM
                   </h3>
                   <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-300">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <form onSubmit={handleAddLink} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Title</label>
                    <input 
                      type="text" 
                      placeholder="My useful link..."
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                      value={newLink.title}
                      onChange={e => setNewLink({...newLink, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">URL</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                      value={newLink.url}
                      onChange={e => setNewLink({...newLink, url: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Notes</label>
                    <textarea 
                      placeholder="Quick note about this..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/50 h-24 resize-none"
                      value={newLink.notes}
                      onChange={e => setNewLink({...newLink, notes: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Reminder Alert</label>
                    <div className="relative">
                      <Bell className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="datetime-local" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                        value={newLink.alertAt}
                        onChange={e => setNewLink({...newLink, alertAt: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Save to Stash
                  </button>
                </form>
             </div>
           )}

           {/* Alerts Summary Panel */}
           <div className="bg-[#16191e] rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                 <h3 className="font-black text-slate-100 tracking-tight flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    UPCOMING ALERTS
                 </h3>
                 <span className="text-[10px] font-black text-slate-500 px-2 py-1 bg-slate-800 rounded-lg">ACTIVE</span>
              </div>
              <div className="p-6 space-y-4">
                 {links.filter(l => l.alertAt && !l.isCompleted).length === 0 ? (
                   <p className="text-xs font-bold text-slate-600 text-center py-4">No pending alerts set.</p>
                 ) : (
                   links.filter(l => l.alertAt && !l.isCompleted).map(link => (
                     <div key={link.id} className="flex items-center space-x-3 group">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-black text-slate-200 truncate group-hover:text-blue-400 transition-colors">{link.title}</p>
                           <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{new Date(link.alertAt!).toLocaleDateString()}</p>
                        </div>
                        <Bell className="w-3.5 h-3.5 text-slate-700" />
                     </div>
                   ))
                 )}
              </div>
           </div>

           <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/10 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <AlertCircle className="w-48 h-48" />
              </div>
              <h3 className="font-black text-xl mb-4 flex items-center relative z-10 tracking-tight uppercase">
                <Bell className="mr-3 w-6 h-6" />
                STAY ON TOP
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed relative z-10 font-bold">
                Set alerts for important resources. Lifevault will notify you at the perfect time so nothing falls through the cracks.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

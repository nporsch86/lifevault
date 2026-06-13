import { useState } from 'react';
import { Share2, Users, X, Check, Clock, Shield, Trash2, Mail, Plus } from 'lucide-react';
import { usePlanner } from '../store/PlannerContext';

export default function Settings() {
  const { sharedCalendars, myShares, shareCalendar, removeShare, respondToSharedCalendar } = usePlanner();
  const [shareEmail, setShareEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (shareEmail) {
      shareCalendar(shareEmail, permission);
      setShareEmail('');
    }
  };

  return (
    <div className="max-w-4xl space-y-12">
      <div>
        <h2 className="text-4xl font-black text-slate-100 tracking-tight mb-2">Settings</h2>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Account & Configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Share My Calendar */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest">Share My Calendar</h3>
          </div>

          <form onSubmit={handleShare} className="bg-[#16191e] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email" 
                  placeholder="friend@example.com"
                  value={shareEmail}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-sm"
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <select 
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                  className="flex-1 bg-slate-800 border border-slate-700/50 rounded-2xl py-3 px-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 appearance-none text-sm"
                >
                  <option value="view">View Only</option>
                  <option value="edit">Can Edit</option>
                </select>
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-500 transition-all flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" /> Share
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shared With</p>
              {myShares.map(share => (
                <div key={share.id} className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl group">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400">
                      {share.owner[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{share.owner}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase flex items-center">
                        <Shield className="w-2.5 h-2.5 mr-1" /> {share.permission} • {share.status}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeShare(share.id)}
                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {myShares.length === 0 && (
                <p className="text-xs font-bold text-slate-600 italic">Not sharing with anyone yet</p>
              )}
            </div>
          </form>
        </div>

        {/* Shared With Me */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest">Shared With Me</h3>
          </div>

          <div className="space-y-3">
            {sharedCalendars.map(share => (
              <div key={share.id} className="bg-[#16191e] border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-100 text-sm tracking-tight">{share.name}</h4>
                    <p className="text-xs font-bold text-slate-500">From {share.owner}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {share.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => respondToSharedCalendar(share.id, 'accepted')}
                        className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-emerald-500 transition-all"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => respondToSharedCalendar(share.id, 'declined')}
                        className="px-4 py-2 bg-slate-800 text-slate-400 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-700 transition-all"
                      >
                        Ignore
                      </button>
                    </>
                  ) : (
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center
                      ${share.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
                    >
                      {share.status === 'accepted' ? <Check className="w-3 h-3 mr-2" /> : <X className="w-3 h-3 mr-2" />}
                      {share.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sharedCalendars.length === 0 && (
              <div className="bg-slate-800/20 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
                <Clock className="w-8 h-8 text-slate-700 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-600">No shared calendars yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

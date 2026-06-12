import React, { useState } from 'react';
import { X, Calendar, Clock, Tag, Link as LinkIcon, Video, ArrowRight, Car, Users, Plus as PlusIcon } from 'lucide-react';
import { usePlanner } from '../store/PlannerContext';
import type { PlannerEvent } from '../store/PlannerContext';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

const CATEGORIES = ['Work', 'Personal', 'Important', 'Confidential', 'Bill', 'Medical', 'Family', 'Health'] as const;

export default function AddEventModal({ isOpen, onClose, initialDate }: AddEventModalProps) {
  const { addEvent } = usePlanner();
  const [event, setEvent] = useState<Partial<PlannerEvent>>({
    title: '',
    date: initialDate || new Date().toISOString().split('T')[0],
    startTime: '09:00',
    category: 'Work',
    meetingLink: '',
    travelTime: 0,
    invitees: [],
  });
  const [newInvitee, setNewInvitee] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event.title || !event.date) return;

    addEvent({
      id: Math.random().toString(36).substr(2, 9),
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      category: event.category as any || 'Work',
      meetingLink: event.meetingLink,
      travelTime: event.travelTime,
      invitees: event.invitees,
      inviteStatus: 'accepted',
    } as PlannerEvent);

    onClose();
    setEvent({
      title: '',
      date: initialDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      category: 'Work',
      meetingLink: '',
      travelTime: 0,
      invitees: [],
    });
    setNewInvitee('');
  };

  const addInvitee = () => {
    if (newInvitee && !event.invitees?.includes(newInvitee)) {
      setEvent({ ...event, invitees: [...(event.invitees || []), newInvitee] });
      setNewInvitee('');
    }
  };

  const removeInvitee = (email: string) => {
    setEvent({ ...event, invitees: event.invitees?.filter(i => i !== email) });
  };

  const quickAddMeet = () => {
    setEvent({ ...event, meetingLink: 'https://meet.google.com/abc-defg-hij' });
  };

  const quickAddZoom = () => {
    setEvent({ ...event, meetingLink: 'https://zoom.us/j/123456789' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#16191e] w-full max-w-lg rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-100 tracking-tight uppercase tracking-widest">New Event</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Event Title</label>
            <input 
              type="text" 
              placeholder="e.g. Weekly Sync"
              value={event.title}
              className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 px-6 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
              onChange={(e) => setEvent({...event, title: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="date" 
                  value={event.date}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  onChange={(e) => setEvent({...event, date: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="time" 
                  value={event.startTime}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  onChange={(e) => setEvent({...event, startTime: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select 
                  value={event.category}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all appearance-none"
                  onChange={(e) => setEvent({...event, category: e.target.value as any})}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Quick Add Link</label>
              <div className="flex space-x-2">
                <button 
                  type="button"
                  onClick={quickAddMeet}
                  className="flex-1 bg-slate-800 border border-slate-700/50 rounded-xl py-3 text-[10px] font-black text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center"
                >
                  <Video className="w-3 h-3 mr-2 text-blue-500" /> Meet
                </button>
                <button 
                  type="button"
                  onClick={quickAddZoom}
                  className="flex-1 bg-slate-800 border border-slate-700/50 rounded-xl py-3 text-[10px] font-black text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center"
                >
                  <Video className="w-3 h-3 mr-2 text-indigo-500" /> Zoom
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Meeting Link</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="url" 
                placeholder="https://meet.google.com/..."
                value={event.meetingLink}
                className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-sm"
                onChange={(e) => setEvent({...event, meetingLink: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Travel Time (Minutes)</label>
            <div className="relative">
              <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="number" 
                placeholder="0"
                min="0"
                step="5"
                value={event.travelTime}
                className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-sm"
                onChange={(e) => setEvent({...event, travelTime: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

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
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInvitee())}
                />
              </div>
              <button 
                type="button"
                onClick={addInvitee}
                className="bg-slate-800 border border-slate-700/50 p-4 rounded-2xl text-blue-500 hover:bg-slate-700 transition-all"
              >
                <PlusIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
              {event.invitees?.map(email => (
                <div key={email} className="bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 flex items-center space-x-2 group">
                  <span className="text-[10px] font-bold text-blue-400">{email}</span>
                  <button 
                    type="button"
                    onClick={() => removeInvitee(email)}
                    className="text-blue-600/50 hover:text-blue-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center group"
          >
            Create Event <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}

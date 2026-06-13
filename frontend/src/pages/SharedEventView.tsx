// import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, Users } from 'lucide-react';

export default function SharedEventView() {
  // const { uuid } = useParams();

  // Mock data for public view
  const event = {
    title: "Strategy Session",
    date: "Wednesday, Oct 29, 2025",
    startTime: "13:00",
    endTime: "14:30",
    location: "Main Office, Floor 4",
    description: "Quarterly strategy review and planning for next year's product roadmap.",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    guestsCount: 8
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#1e293b] rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <img src="/logo-icon.png" alt="Lifevault" className="w-10 h-10" />
          <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase tracking-widest">Lifevault</h1>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
             <h2 className="text-2xl font-black text-slate-100 mb-2 leading-tight">{event.title}</h2>
             <div className="flex items-center text-blue-400 space-x-2 text-sm font-bold">
               <Calendar className="w-4 h-4" />
               <span>{event.date}</span>
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-slate-300 space-x-3">
              <Clock className="w-5 h-5 text-slate-500" />
              <span className="font-bold">{event.startTime} - {event.endTime}</span>
            </div>

            {event.location && (
              <div className="flex items-start text-slate-300 space-x-3">
                <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                <span className="font-bold">{event.location}</span>
              </div>
            )}

            <div className="flex items-center text-slate-300 space-x-3">
              <Users className="w-5 h-5 text-slate-500" />
              <span className="font-bold">{event.guestsCount} Guests</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Description</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {event.description}
            </p>
          </div>

          {event.meetingLink && (
            <a 
              href={event.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center group"
            >
              <Video className="w-4 h-4 mr-2" />
              Join Meeting
            </a>
          )}

          <div className="text-center pt-8">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Organized via Lifevault</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center">
        <span>Get the app</span>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mx-3"></div>
        <span>Sign up free</span>
      </div>
    </div>
  );
}

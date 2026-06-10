import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Users, MapPin, Link as LinkIcon, 
  Pencil, Eraser, Type,
  StickyNote, Share2, 
  Download, MoreVertical, Plus, 
  Calendar,
  Undo2, Redo2, Save, Search
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface Sticky {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

const COLORS = [
  { name: 'white', value: '#ffffff' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'purple', value: '#a855f7' },
  { name: 'amber', value: '#f59e0b' },
  { name: 'green', value: '#10b981' },
];

const PEN_WIDTHS = [2, 4, 8];

export default function Notes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'text' | 'sticky'>('pencil');
  const [currentColor, setCurrentColor] = useState('#3b82f6'); 
  const [currentWidth, setCurrentWidth] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stickies, setStickies] = useState<Sticky[]>([
    { id: '1', x: 400, y: 150, text: 'Goal', color: 'bg-amber-400/90' },
    { id: '2', x: 150, y: 300, text: 'Add tasks', color: 'bg-amber-300/90' },
    { id: '3', x: 600, y: 300, text: 'User stories', color: 'bg-amber-200/90' },
  ]);

  const [notes, setNotes] = useState([
    { id: '1', title: 'Weekly Sprint Planning', date: 'Oct 18', preview: 'Focus on v2.1 shipping...' },
    { id: '2', title: 'Product Design Sync', date: 'Oct 15', preview: 'Reviewing blue theme...' },
    { id: '3', title: 'Client Feedback', date: 'Oct 12', preview: 'They loved the private vault.' },
  ]);

  const [selectedNoteId, setSelectedNoteId] = useState('1');

  const selectedNote = notes.find(n => n.id === selectedNoteId) || notes[0];
  const meetingDetails = {
    time: '10:00 – 11:00 AM',
    location: 'Conference Room B / Zoom link',
    attendees: [
      { name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=1' },
      { name: 'Beth', avatar: 'https://i.pravatar.cc/150?u=2' },
      { name: 'Chris', avatar: 'https://i.pravatar.cc/150?u=3' },
    ]
  };

  // Canvas Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        redraw();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [strokes]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(stroke => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      stroke.points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    if (currentStroke.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = currentTool === 'eraser' ? '#1a1a2e' : currentColor;
      ctx.lineWidth = currentWidth;
      currentStroke.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }, [strokes, currentStroke, currentColor, currentWidth, currentTool]);

  useEffect(() => {
    redraw();
  }, [currentStroke, redraw]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentTool === 'pencil' || currentTool === 'eraser') {
      setIsDrawing(true);
      const point = getPoint(e);
      setCurrentStroke([point]);
    } else if (currentTool === 'sticky') {
      const point = getPoint(e);
      const newSticky: Sticky = {
        id: Date.now().toString(),
        x: point.x - 50,
        y: point.y - 50,
        text: 'New Note',
        color: 'bg-amber-200/90'
      };
      setStickies([...stickies, newSticky]);
      setCurrentTool('pencil');
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const point = getPoint(e);
    setCurrentStroke(prev => [...prev, point]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes(prev => [...prev, {
        points: currentStroke,
        color: currentTool === 'eraser' ? '#1a1a2e' : currentColor,
        width: currentWidth
      }]);
    }
    setCurrentStroke([]);
  };

  const clearCanvas = () => {
    setStrokes([]);
    setStickies([]);
  };

  return (
    <div className="h-full flex space-x-8">
      {/* Notes List Sidebar */}
      <div className="w-80 flex flex-col space-y-6">
        <div className="space-y-1">
          <p className="text-blue-500 font-black text-xs uppercase tracking-[0.2em]">Vault</p>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">Meeting Notes</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search notes..."
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium text-slate-200"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          {notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())).map(note => (
            <div 
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedNoteId === note.id ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className={`font-black text-sm truncate ${selectedNoteId === note.id ? 'text-white' : 'text-slate-200 group-hover:text-blue-400'}`}>{note.title}</h4>
                <span className={`text-[10px] font-bold shrink-0 ml-2 ${selectedNoteId === note.id ? 'text-blue-200' : 'text-slate-500'}`}>{note.date}</span>
              </div>
              <p className={`text-xs font-medium line-clamp-1 ${selectedNoteId === note.id ? 'text-blue-100' : 'text-slate-500'}`}>{note.preview}</p>
            </div>
          ))}
          
          <button 
            onClick={() => {
              const newNote = { id: Date.now().toString(), title: 'Untitled Note', date: 'Oct 20', preview: 'No content yet.' };
              setNotes([newNote, ...notes]);
              setSelectedNoteId(newNote.id);
            }}
            className="w-full flex items-center justify-center space-x-2 p-4 rounded-2xl border-2 border-dashed border-slate-700/50 text-slate-500 hover:border-blue-600/50 hover:text-blue-400 transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">New Note</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col space-y-6 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-100 tracking-tight truncate max-w-md">{selectedNote.title}</h2>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all border border-slate-700 font-bold text-sm">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-600/20">
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Meeting Details Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <MoreVertical className="w-5 h-5 text-slate-500 cursor-pointer" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 p-3 rounded-2xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time & Date</p>
                <p className="text-sm font-bold text-slate-200">{meetingDetails.time}</p>
                <p className="text-xs font-medium text-slate-400">{selectedNote.date}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/20 p-3 rounded-2xl">
                <MapPin className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</p>
                <p className="text-sm font-bold text-slate-200 truncate max-w-[150px]">{meetingDetails.location}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-green-500/20 p-3 rounded-2xl">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendees</p>
                <div className="flex -space-x-2 mt-1">
                  {meetingDetails.attendees.map((a, i) => (
                    <img 
                      key={i} 
                      src={a.avatar} 
                      alt={a.name} 
                      className="w-7 h-7 rounded-full border-2 border-slate-800 shadow-sm"
                    />
                  ))}
                  <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    +2
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 p-3 rounded-2xl">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Linked Event</p>
                <p className="text-sm font-bold text-slate-200">Weekly Sync</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace: Canvas & Notes */}
        <div className="flex-1 bg-[#1a1a2e] rounded-3xl border border-slate-800/50 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
          {/* Canvas Background Grid */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ 
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          ></div>

          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="flex-1 cursor-crosshair relative z-10"
          />

          {/* Stickies */}
          {stickies.map((sticky) => (
            <div
              key={sticky.id}
              className={`absolute ${sticky.color} p-4 w-40 h-40 shadow-xl rotate-[-2deg] flex flex-col justify-between group cursor-grab active:cursor-grabbing z-20`}
              style={{ left: sticky.x, top: sticky.y }}
            >
              <textarea
                className="bg-transparent border-none focus:ring-0 text-slate-900 font-handwriting text-lg resize-none flex-1 leading-tight"
                defaultValue={sticky.text}
              />
              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-4 h-4 text-slate-700 rotate-45 cursor-pointer" onClick={() => setStickies(stickies.filter(s => s.id !== sticky.id))} />
              </div>
            </div>
          ))}

          {/* Toolbar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2 flex items-center space-x-1 shadow-2xl z-30">
            <div className="flex items-center border-r border-slate-700 pr-2 mr-1">
              <button 
                onClick={() => setCurrentTool('pencil')}
                className={`p-3 rounded-xl transition-all ${currentTool === 'pencil' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentTool('eraser')}
                className={`p-3 rounded-xl transition-all ${currentTool === 'eraser' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
              >
                <Eraser className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentTool('text')}
                className={`p-3 rounded-xl transition-all ${currentTool === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
              >
                <Type className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentTool('sticky')}
                className={`p-3 rounded-xl transition-all ${currentTool === 'sticky' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
              >
                <StickyNote className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2 px-3 border-r border-slate-700 pr-4 mr-1">
              {COLORS.map(c => (
                <button 
                  key={c.name}
                  onClick={() => setCurrentColor(c.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${currentColor === c.value ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2 px-3 border-r border-slate-700 pr-4 mr-1">
              {PEN_WIDTHS.map(w => (
                <button 
                  key={w}
                  onClick={() => setCurrentWidth(w)}
                  className={`rounded-full transition-all flex items-center justify-center ${currentWidth === w ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  style={{ width: 32, height: 32 }}
                >
                  <div className="bg-current rounded-full" style={{ width: w, height: w }} />
                </button>
              ))}
            </div>

            <div className="flex items-center pl-2">
              <button 
                onClick={clearCanvas}
                className="p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <Download className="w-5 h-5" />
              </button>
              <div className="w-px h-8 bg-slate-700 mx-2" />
              <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-widest">
                Link to Event
              </button>
            </div>
          </div>

          {/* History Controls */}
          <div className="absolute top-8 right-8 flex items-center space-x-2 z-30">
            <button 
              className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 p-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
              onClick={() => setStrokes(strokes.slice(0, -1))}
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 p-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all opacity-50 cursor-not-allowed">
              <Redo2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

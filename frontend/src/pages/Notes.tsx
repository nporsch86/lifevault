import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Users, MapPin, Link as LinkIcon, 
  Pencil, Eraser,
  StickyNote, Share2, 
  MoreVertical, Plus, 
  Calendar,
  Undo2, Save, Search,
  Palette, Highlighter, X, Clock, Sparkles, BrainCircuit, ListChecks, ArrowRight
} from 'lucide-react';
import { usePlanner } from '../store/PlannerContext';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  type: 'pencil' | 'highlighter';
}

interface Sticky {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#334155' },
  { name: 'Charcoal', value: '#1e293b' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Sky Blue', value: '#0ea5e9' },
  { name: 'Navy', value: '#1e3a8a' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Crimson', value: '#991b1b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', value: '#fde047' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Blue', value: '#60a5fa' },
  { name: 'Orange', value: '#fb923c' },
];

const PEN_WIDTHS = [2, 4, 8, 12];

export default function Notes() {
  const { isPremium, setPremium } = usePlanner();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pencil' | 'highlighter' | 'eraser' | 'text' | 'sticky'>('pencil');
  const [currentColor, setCurrentColor] = useState('#3b82f6'); 
  const [currentWidth, setCurrentWidth] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(['#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#000000']);
  
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
      if (stroke.type === 'highlighter') {
        ctx.strokeStyle = stroke.color + '4D'; // ~30% opacity (4D in hex is 77, 77/255 ≈ 0.3)
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.lineWidth = stroke.width;
      stroke.points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    if (currentStroke.length > 0) {
      ctx.beginPath();
      const color = currentTool === 'eraser' ? '#1a1a2e' : currentColor;
      if (currentTool === 'highlighter') {
        ctx.strokeStyle = color + '4D';
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.strokeStyle = color;
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.lineWidth = currentWidth;
      currentStroke.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [strokes, currentStroke, currentColor, currentWidth, currentTool]);

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
  }, [strokes, redraw]);

  useEffect(() => {
    redraw();
  }, [currentStroke, redraw]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentTool === 'pencil' || currentTool === 'eraser' || currentTool === 'highlighter') {
      setIsDrawing(true);
      const point = getPoint(e);
      setCurrentStroke([point]);
      
      // Update recent colors if pencil or highlighter
      if (currentTool !== 'eraser' && !recentColors.includes(currentColor)) {
        setRecentColors(prev => [currentColor, ...prev.slice(0, 4)]);
      }
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
        width: currentWidth,
        type: currentTool === 'highlighter' ? 'highlighter' : 'pencil'
      }]);
    }
    setCurrentStroke([]);
  };

  const handleSummarize = () => {
    if (!isPremium) {
      setShowUpsell(true);
      return;
    }
    setIsSummarizing(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsSummarizing(false);
      setShowSummary(true);
    }, 1500);
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
            <button 
              onClick={handleSummarize}
              disabled={isSummarizing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-bold text-sm shadow-lg ${isSummarizing ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/20'}`}
            >
              {isSummarizing ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>AI Summarize</span>
            </button>
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

          {/* Color Palette Overlay */}
          {showPalette && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-2xl border border-slate-700/50 rounded-[2rem] p-8 shadow-2xl z-40 w-[400px] animate-in zoom-in slide-in-from-bottom-4 duration-200">
               <div className="space-y-6">
                 <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pen Palette</h4>
                   <div className="grid grid-cols-7 gap-3">
                     {COLORS.map(c => (
                      <button 
                        key={c.name}
                        onClick={() => {
                          setCurrentColor(c.value);
                          if (currentTool === 'highlighter' || currentTool === 'eraser') setCurrentTool('pencil');
                        }}
                        title={c.name}
                        className={`w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 ${currentColor === c.value && currentTool !== 'highlighter' ? 'border-white ring-2 ring-white/20' : 'border-white/5'}`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                   </div>
                 </div>

                 <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Highlighter Palette</h4>
                   <div className="flex space-x-4">
                     {HIGHLIGHTER_COLORS.map(c => (
                      <button 
                        key={c.name}
                        onClick={() => {
                          setCurrentColor(c.value);
                          setCurrentTool('highlighter');
                        }}
                        title={`${c.name} Highlighter`}
                        className={`w-10 h-10 rounded-2xl border-2 transition-all hover:scale-110 ${currentColor === c.value && currentTool === 'highlighter' ? 'border-white ring-2 ring-white/20' : 'border-white/5'}`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                   </div>
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                   <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Custom</span>
                   </div>
                   <input 
                    type="color" 
                    value={currentColor} 
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-12 h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                   />
                 </div>
               </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-[2rem] px-6 py-3 flex items-center space-x-6 shadow-2xl z-30">
            {/* Pen Section */}
            <div className="flex items-center space-x-2 pr-6 border-r border-slate-700/50">
              <button 
                onClick={() => setCurrentTool('pencil')}
                className={`p-3 rounded-2xl transition-all ${currentTool === 'pencil' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                title="Pen"
              >
                <Pencil className="w-5 h-5" />
              </button>
              
              <div className="flex items-center -space-x-1 ml-2">
                {recentColors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentColor(color);
                      if (currentTool === 'highlighter' || currentTool === 'eraser') setCurrentTool('pencil');
                    }}
                    className={`w-6 h-6 rounded-full border-2 border-slate-800 z-${10-i} hover:scale-110 transition-transform`}
                    style={{ backgroundColor: color }}
                    title="Recent Color"
                  />
                ))}
                <button 
                  onClick={() => setShowPalette(!showPalette)}
                  className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  title="More Colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Highlighter Section */}
            <div className="flex items-center space-x-2 pr-6 border-r border-slate-700/50">
              <button 
                onClick={() => setCurrentTool('highlighter')}
                className={`p-3 rounded-2xl transition-all ${currentTool === 'highlighter' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                title="Highlighter"
              >
                <Highlighter className="w-5 h-5" />
              </button>
            </div>

            {/* Sizes Slider */}
            <div className="flex items-center space-x-4 pr-6 border-r border-slate-700/50">
              <div className="flex items-center space-x-2">
                {PEN_WIDTHS.map(w => (
                  <button 
                    key={w}
                    onClick={() => setCurrentWidth(w)}
                    className={`rounded-full transition-all flex items-center justify-center ${currentWidth === w ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    style={{ width: 28, height: 28 }}
                    title={`Size ${w}px`}
                  >
                    <div className="bg-current rounded-full" style={{ width: w/1.5, height: w/1.5 }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Eraser & Actions */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentTool('eraser')}
                className={`p-3 rounded-2xl transition-all ${currentTool === 'eraser' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                title="Eraser"
              >
                <Eraser className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentTool('sticky')}
                className={`p-3 rounded-2xl transition-all ${currentTool === 'sticky' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                title="Sticky Note"
              >
                <StickyNote className="w-5 h-5" />
              </button>
              <div className="w-px h-8 bg-slate-700/50 mx-2" />
              <button 
                onClick={clearCanvas}
                className="p-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                title="Clear All"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* History Controls */}
          <div className="absolute top-8 right-8 flex items-center space-x-2 z-30">
            <button 
              className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 p-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
              onClick={() => setStrokes(strokes.slice(0, -1))}
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <div className="flex items-center bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-2 space-x-2 ml-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Sidebar Panel */}
      {showSummary && (
        <div className="w-96 flex flex-col space-y-6 animate-in slide-in-from-right duration-300 border-l border-slate-800 pl-8 h-full overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-purple-400">
              <BrainCircuit className="w-5 h-5" />
              <h3 className="font-black text-lg uppercase tracking-widest">AI Insights</h3>
            </div>
            <button onClick={() => setShowSummary(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
            {/* Summary Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Summary</h4>
              </div>
              <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/30">
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  The team discussed the upcoming v2.1 shipping schedule. Focus remains on the premium feature rollout and the private vault biometric integration. Alex will handle the final design review.
                </p>
              </div>
            </div>

            {/* Action Items */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action Items</h4>
              </div>
              <div className="space-y-3">
                {[
                  'Finalize v2.1 feature list by Friday',
                  'Schedule design review with Alex',
                  'Test biometric lock on tablet hardware'
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30 group hover:border-blue-500/30 transition-all">
                    <div className="mt-0.5">
                      <ListChecks className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Points */}
            <div className="space-y-4 pb-10">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Key Points</h4>
              </div>
              <ul className="space-y-3 px-4">
                <li className="text-xs font-medium text-slate-400 list-disc marker:text-emerald-500">Positive feedback on the blue theme from beta testers.</li>
                <li className="text-xs font-medium text-slate-400 list-disc marker:text-emerald-500">Concerns about offline sync latency.</li>
                <li className="text-xs font-medium text-slate-400 list-disc marker:text-emerald-500">Next sync scheduled for next Monday.</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <button 
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-2"
              onClick={() => {
                // Mock adding to tasks
                alert('Action items added to your task list!');
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Import Actions to Tasks</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Premium Upsell Modal */}
      {showUpsell && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1a1a2e] w-full max-w-lg rounded-[2.5rem] border border-slate-800 p-10 shadow-2xl relative overflow-hidden text-center">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full" />

            <button 
              onClick={() => setShowUpsell(false)}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-[2rem] mb-8 ring-1 ring-white/10">
              <Sparkles className="w-12 h-12 text-purple-400" />
            </div>

            <h3 className="text-3xl font-black text-white tracking-tight mb-4">Unlock AI Intelligence</h3>
            <p className="text-slate-400 font-medium leading-relaxed mb-10 max-w-sm mx-auto">
              Get instant meeting summaries, automated action items, and smart insights with Lifevault Premium.
            </p>

            <div className="space-y-4 mb-10 text-left">
              {[
                'Smart meeting summaries',
                'One-click action items import',
                'Topic detection and key points',
                'Advanced search through drawings'
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                setPremium(true);
                setShowUpsell(false);
                handleSummarize();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-purple-500/20 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center space-x-2 group"
            >
              <span>Upgrade to Premium</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Starting at $7.99 / month</p>
          </div>
        </div>
      )}
    </div>
  );
}

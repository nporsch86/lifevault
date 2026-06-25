import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, X, Check, Eraser } from 'lucide-react';

interface HandwritingOverlayProps {
  onCapture: (text: string, dataUrl?: string) => void;
  onCancel: () => void;
  hour?: number;
}

export default function HandwritingOverlay({ onCapture, onCancel, hour }: HandwritingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI canvas — crisp on tablet/stylus
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Set drawing styles
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = Math.max(3, 4 / dpr); // physical ~4px wide minimum
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    setHasContent(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Reset canvas (also resets the transform)
    canvas.width = canvas.width;
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = Math.max(3, 4 / dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasContent(false);
  };

  const handleFinish = () => {
    if (!hasContent) return;
    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const dataUrl = canvas?.toDataURL('image/png');

    // Use the handwriting image directly — no OCR available yet
    // Title will show the handwritten note rendered from the image
    setTimeout(() => {
      // Use a generic title — the handwritten image renders inline
      onCapture("📝 Handwritten Note", dataUrl);
      setIsProcessing(false);
    }, 500);
  };

  return (
    <div 
      className="absolute inset-0 z-[100] bg-blue-600/5 backdrop-blur-[1px] animate-in fade-in duration-200 rounded-2xl border-2 border-blue-500/30 touch-none select-none"
      onPointerDown={(e) => e.stopPropagation()}
      style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="absolute top-2 right-2 flex space-x-1 z-[110]">
        <button 
          onClick={clearCanvas}
          className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
          title="Clear"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={onCancel}
          className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition-colors border border-slate-700"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />

      {hasContent && !isProcessing && (
        <button 
          onClick={handleFinish}
          className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center animate-in slide-in-from-bottom-2"
        >
          <Check className="w-3.5 h-3.5 mr-1" /> Create Event
        </button>
      )}

      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-2xl z-[120]">
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
               <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
               <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
            </div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] animate-pulse">Converting Handwriting...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-3 pointer-events-none">
        <p className="text-[8px] font-black text-blue-500/50 uppercase tracking-widest flex items-center">
          <Sparkles className="w-3 h-3 mr-1" /> Stylus Mode Active ({hour}:00)
        </p>
      </div>
    </div>
  );
}

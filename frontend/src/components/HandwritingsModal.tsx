import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, X, Check, Eraser } from 'lucide-react';

interface HandwritingsModalProps {
  onCapture: (text: string, dataUrl?: string) => void;
  onCancel: () => void;
  dateStr?: string;
}

export default function HandwritingsModal({ onCapture, onCancel, dateStr }: HandwritingsModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI canvas
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = Math.max(3, 5 / dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (canvas: HTMLCanvasElement, e: React.PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasContent(true);
    const pos = getPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
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
    canvas.width = canvas.width;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = Math.max(3, 5 / dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasContent(false);
  };

  const handleFinish = () => {
    if (!hasContent) return;
    setIsProcessing(true);
    const canvas = canvasRef.current;
    const dataUrl = canvas?.toDataURL('image/png');
    setTimeout(() => {
      onCapture("📝 Handwritten Note", dataUrl);
      setIsProcessing(false);
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 p-4 md:p-8"
      onPointerDown={(e) => e.target === e.currentTarget && onCancel()}
      style={{ touchAction: 'none' }}
    >
      <div className="bg-[#16191e] border border-slate-700/50 rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">
              Handwritten Note {dateStr ? `· ${dateStr}` : ''}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearCanvas}
              className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors border border-slate-700"
              title="Clear"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-colors border border-slate-700"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 p-5 min-h-[300px] md:min-h-[400px] bg-slate-900/50">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-2xl bg-slate-950 border-2 border-blue-500/20 cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-800">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
            <Sparkles className="w-3 h-3 mr-1.5 text-blue-500/60" />
            Stylus · Write naturally
          </p>
          <button
            onClick={handleFinish}
            disabled={!hasContent || isProcessing}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center transition-all ${
              !hasContent || isProcessing
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500'
            }`}
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Add to Calendar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
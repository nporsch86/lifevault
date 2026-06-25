import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, X, Check, Eraser, Loader2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';

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
  const [recognizedText, setRecognizedText] = useState('');
  const [ocrReady, setOcrReady] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(true);

  // Initialize Tesseract worker on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const worker = await createWorker('eng');
        if (cancelled) { await worker.terminate(); return; }
        // Store worker on the ref so handleFinish can use it
        (window as any).__ocrWorker = worker;
        setOcrReady(true);
        setOcrLoading(false);
      } catch (err) {
        console.error('OCR init error:', err);
        setOcrLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      const w = (window as any).__ocrWorker;
      if (w) { w.terminate(); (window as any).__ocrWorker = null; }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    setRecognizedText('');
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
    setRecognizedText('');
  };

  const handleFinish = async () => {
    if (!hasContent) return;
    setIsProcessing(true);
    const canvas = canvasRef.current;
    const dataUrl = canvas?.toDataURL('image/png');

    try {
      const worker = (window as any).__ocrWorker;
      if (!worker) {
        // Fallback: use title without OCR
        onCapture("📝 Handwritten Note", dataUrl);
        setIsProcessing(false);
        return;
      }
      const { data } = await worker.recognize(dataUrl);
      const text = data.text?.trim() || '';
      if (text) {
        setRecognizedText(text);
        onCapture(text, dataUrl);
      } else {
        onCapture("📝 Handwritten Note", dataUrl);
      }
    } catch (err) {
      console.error('OCR error:', err);
      onCapture("📝 Handwritten Note", dataUrl);
    }
    setIsProcessing(false);
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
            {ocrLoading && !ocrReady && (
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center mr-2">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Loading OCR...
              </span>
            )}
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

        {/* Recognized Text Preview */}
        {recognizedText && (
          <div className="px-5 py-3 bg-blue-600/10 border-t border-blue-600/20">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Recognized:</p>
            <p className="text-sm font-bold text-slate-100">{recognizedText}</p>
          </div>
        )}

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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recognizing...
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
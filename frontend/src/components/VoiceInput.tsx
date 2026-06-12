import { useState, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onCommand: (command: string) => void;
  className?: string;
}

export default function VoiceInput({ onCommand, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event: any) => {
      setError(`Error occurred in recognition: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript;
      onCommand(command);
    };

    recognition.start();
  }, [onCommand]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <button
        onClick={startListening}
        disabled={isListening}
        className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
          isListening 
            ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20' 
            : 'bg-slate-800 text-slate-400 hover:text-blue-500 hover:bg-slate-700 border border-slate-700/50'
        }`}
        title="Voice Command"
      >
        {isListening ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
      
      {isListening && (
        <div className="absolute left-full ml-4 whitespace-nowrap bg-rose-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl animate-in slide-in-from-left-2 duration-200 uppercase tracking-widest z-50">
          Listening...
        </div>
      )}

      {error && (
        <div className="absolute top-full mt-2 left-0 whitespace-nowrap bg-rose-900/90 text-rose-200 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl z-50 border border-rose-500/20">
          {error}
        </div>
      )}
    </div>
  );
}

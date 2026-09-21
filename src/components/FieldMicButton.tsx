import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../lib/speechRecognition';

interface FieldMicButtonProps {
  onCapture: (text: string) => void;
  title?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const FieldMicButton: React.FC<FieldMicButtonProps> = ({
  onCapture,
  title = 'Dictar este campo con voz',
  className = '',
  size = 'sm',
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef<{ start: () => Promise<void>; stop: () => void } | null>(null);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const toggleRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const rec = createSpeechRecognizer(
      (text, isFinal) => {
        if (text && isFinal) {
          onCapture(text);
          // Automatically stop after capturing a complete sentence
          setTimeout(() => {
            if (recognizerRef.current) recognizerRef.current.stop();
            setIsListening(false);
          }, 300);
        }
      },
      (err) => {
        console.warn('FieldMicButton error:', err);
        setIsListening(false);
      },
      (listening) => {
        setIsListening(listening);
      }
    );

    recognizerRef.current = rec;
    rec.start();
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const btnPadding = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <button
      type="button"
      onClick={toggleRecording}
      title={isListening ? 'Detener dictado' : title}
      className={`inline-flex items-center justify-center rounded-lg transition-all ${btnPadding} ${
        isListening
          ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-400'
          : 'bg-slate-100 hover:bg-teal-50 text-slate-500 hover:text-teal-700 border border-slate-200 hover:border-teal-200'
      } ${className}`}
    >
      {isListening ? (
        <MicOff className={iconSize} />
      ) : (
        <Mic className={iconSize} />
      )}
    </button>
  );
};

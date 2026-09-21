import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  X,
  Sparkles,
  Radio,
  ArrowRight
} from 'lucide-react';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  speakPrompt,
  stopSpeaking,
  cleanVoiceSentence
} from '../lib/speechRecognition';

export interface VoiceStep {
  id: string;
  label: string;
  question: string;
  placeholder?: string;
  currentValue?: string | number;
  onApply: (val: string) => void;
  parser?: (text: string) => string | number | undefined;
}

interface VoiceGuidedAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  steps: VoiceStep[];
}

export const VoiceGuidedAssistant: React.FC<VoiceGuidedAssistantProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = 'Dile al asistente los datos requeridos ítem por ítem',
  steps,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [capturedText, setCapturedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);

  const recognizerRef = useRef<{ start: () => Promise<void>; stop: () => void } | null>(null);
  const cancelSpeakingRef = useRef<(() => void) | null>(null);
  const silenceTimerRef = useRef<any>(null);

  const currentStep = steps[currentStepIndex];

  // Stop everything on close
  useEffect(() => {
    if (!isOpen) {
      cleanupAudio();
    } else {
      setCurrentStepIndex(0);
      setCapturedText(currentStep?.currentValue ? String(currentStep.currentValue) : '');
    }
  }, [isOpen]);

  const cleanupAudio = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
    if (cancelSpeakingRef.current) {
      cancelSpeakingRef.current();
      cancelSpeakingRef.current = null;
    }
    stopSpeaking();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setIsListening(false);
    setIsSpeakingPrompt(false);
  };

  // Start current step prompt and listening
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    cleanupAudio();
    setCapturedText(currentStep.currentValue ? String(currentStep.currentValue) : '');
    setInterimText('');

    if (speechEnabled) {
      setIsSpeakingPrompt(true);
      const cancel = speakPrompt(currentStep.question, () => {
        setIsSpeakingPrompt(false);
        startListeningForCurrentStep();
      });
      cancelSpeakingRef.current = cancel;
    } else {
      startListeningForCurrentStep();
    }

    return () => {
      cleanupAudio();
    };
  }, [currentStepIndex, isOpen, speechEnabled]);

  const startListeningForCurrentStep = () => {
    if (!isSpeechRecognitionSupported()) return;

    const rec = createSpeechRecognizer(
      (text, isFinal) => {
        if (!text) return;
        setInterimText(isFinal ? '' : text);
        setCapturedText(text);

        // Apply immediately to the form field in real-time
        currentStep.onApply(text);

        // If it's a final transcript, allow 1.4s of pause before suggesting next
        if (isFinal) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            // Optional auto advance for concise fields (like dni or age)
            // We keep user in control with the Next button, or auto proceed
          }, 1400);
        }
      },
      (err) => {
        console.warn('Voice step error:', err);
        setIsListening(false);
      },
      (listening) => {
        setIsListening(listening);
      }
    );

    recognizerRef.current = rec;
    rec.start();
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Completed all items
      cleanupAudio();
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleRetryCurrent = () => {
    cleanupAudio();
    setCapturedText('');
    setInterimText('');
    currentStep.onApply('');
    startListeningForCurrentStep();
  };

  const handleToggleMic = () => {
    if (isListening) {
      if (recognizerRef.current) recognizerRef.current.stop();
      setIsListening(false);
    } else {
      startListeningForCurrentStep();
    }
  };

  if (!isOpen || !currentStep) return null;

  const progressPct = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Sparkles className="w-4 h-4 text-teal-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{title}</h2>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSpeechEnabled(!speechEnabled)}
              title={speechEnabled ? 'Silenciar preguntas de voz' : 'Activar lectura de preguntas'}
              className={`p-2 rounded-xl border text-xs transition ${
                speechEnabled
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                cleanupAudio();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
            <span className="text-teal-400">
              Ítem {currentStepIndex + 1} de {steps.length}: <span className="text-white font-extrabold">{currentStep.label}</span>
            </span>
            <span>{progressPct}% completado</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question & Audio Wave */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            {isSpeakingPrompt ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Volume2 className="w-3 h-3 animate-pulse" />
                <span>Preguntando...</span>
              </span>
            ) : isListening ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Radio className="w-3 h-3 animate-pulse text-teal-400" />
                <span>Escuchando tu voz...</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                <MicOff className="w-3 h-3" />
                <span>Pausado</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
            "{currentStep.question}"
          </h3>

          {/* Spoken Text Display Box */}
          <div className="min-h-[64px] flex items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800/90 text-sm">
            {capturedText ? (
              <p className="font-semibold text-teal-300 break-words">
                {capturedText}
                {interimText && <span className="text-slate-400 font-normal italic"> {interimText}</span>}
              </p>
            ) : (
              <p className="text-slate-500 text-xs italic">
                {isListening ? 'Habla ahora con naturalidad...' : 'Toca el micrófono para comenzar a dictar'}
              </p>
            )}
          </div>
        </div>

        {/* Step Navigation Pill Dots */}
        <div className="flex justify-center items-center flex-wrap gap-1.5 max-h-16 overflow-y-auto px-1 py-1">
          {steps.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                idx === currentStepIndex
                  ? 'bg-teal-500 text-slate-950 scale-105 shadow-md shadow-teal-500/20 font-black'
                  : st.currentValue
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {idx + 1}. {st.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition"
              title="Ítem anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRetryCurrent}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Borrar y repetir este ítem"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToggleMic}
              className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isListening ? 'Pausar' : 'Escuchar'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleNextStep}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center space-x-1.5 active:scale-98 transition"
            >
              <span>{currentStepIndex === steps.length - 1 ? 'Finalizar Carga' : 'Siguiente Ítem'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

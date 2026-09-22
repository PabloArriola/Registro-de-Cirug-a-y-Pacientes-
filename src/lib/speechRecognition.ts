// Speech recognition helper for medical surgical protocols

// Define browser SpeechRecognition types safely
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): {
    isFinal: boolean;
    [index: number]: SpeechRecognitionResultItem;
  };
  [index: number]: {
    isFinal: boolean;
    0: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): ISpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): ISpeechRecognition;
    };
  }
}

export function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export function openInStandaloneWindow(): void {
  try {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  } catch (e) {
    console.error('Failed to open standalone window', e);
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognizer(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (errorMessage: string) => void,
  onStateChange: (listening: boolean) => void
): { start: () => Promise<void>; stop: () => void; isSupported: boolean } {
  if (!isSpeechRecognitionSupported()) {
    return {
      start: async () => onError('El navegador no soporta reconocimiento de voz nativo. Se recomienda Google Chrome o Microsoft Edge.'),
      stop: () => {},
      isSupported: false,
    };
  }

  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionConstructor) {
    return {
      start: async () => onError('Reconocimiento no disponible.'),
      stop: () => {},
      isSupported: false,
    };
  }

  const recognizer = new SpeechRecognitionConstructor();
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = 'es-AR'; // Español latinoamericano / Argentina

  let active = false;

  recognizer.onstart = () => {
    active = true;
    onStateChange(true);
  };

  recognizer.onend = () => {
    active = false;
    onStateChange(false);
  };

  recognizer.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.warn('Speech recognition error:', event.error);
    active = false;
    onStateChange(false);

    if (event.error === 'not-allowed') {
      if (isInIframe()) {
        onError('mic_iframe_blocked');
      } else {
        onError('mic_denied_browser');
      }
    } else if (event.error === 'no-speech') {
      // Ignored silent error
    } else if (event.error === 'audio-capture') {
      onError('No se detectó ningún micrófono conectado a tu equipo.');
    } else if (event.error === 'network') {
      onError('Error de red al procesar el audio. Verifica tu conexión a internet.');
    } else {
      onError(`Error de reconocimiento: ${event.error}`);
    }
  };

  recognizer.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      const text = item[0].transcript;
      if (item.isFinal) {
        finalTranscript += text + ' ';
      } else {
        interimTranscript += text;
      }
    }

    if (finalTranscript.trim()) {
      onTranscript(finalTranscript.trim(), true);
    } else if (interimTranscript.trim()) {
      onTranscript(interimTranscript.trim(), false);
    }
  };

  return {
    start: async () => {
      try {
        if (active) return;

        // Try explicitly requesting audio permission via getUserMedia first if available
        // This prompts the browser's native permission modal reliably in top-level tabs
        if (navigator?.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Release the tracks immediately so recognizer has exclusive access
            stream.getTracks().forEach(track => track.stop());
          } catch (mediaErr: any) {
            console.warn('Microphone permission check returned error:', mediaErr);
            if (mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError') {
              if (isInIframe()) {
                onError('mic_iframe_blocked');
                return;
              } else {
                onError('mic_denied_browser');
                return;
              }
            }
          }
        }

        recognizer.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition', err);
        if (err?.name === 'NotAllowedError' || err?.message?.includes('not-allowed')) {
          if (isInIframe()) {
            onError('mic_iframe_blocked');
          } else {
            onError('mic_denied_browser');
          }
        } else {
          onError('No se pudo iniciar el dictado por voz. Verifica los permisos del micrófono.');
        }
      }
    },
    stop: () => {
      try {
        if (active) {
          recognizer.stop();
        }
      } catch (err) {
        console.error('Failed to stop speech recognition', err);
      }
    },
    isSupported: true,
  };
}

// Speech Synthesis (Text-to-Speech) for Voice Assistant Prompts
const PREFERRED_VOICE_KEY = 'cirugiamed_preferred_voice_uri';
const PREFERRED_RATE_KEY = 'cirugiamed_preferred_voice_rate';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getSavedVoiceUri(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PREFERRED_VOICE_KEY);
}

export function savePreferredVoiceUri(uri: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_VOICE_KEY, uri);
}

export function getSavedVoiceRate(): number {
  if (typeof window === 'undefined') return 0.98;
  const val = localStorage.getItem(PREFERRED_RATE_KEY);
  if (!val) return 0.98;
  const num = parseFloat(val);
  return isNaN(num) ? 0.98 : num;
}

export function savePreferredVoiceRate(rate: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_RATE_KEY, String(rate));
}

export function scoreSpanishVoice(v: SpeechSynthesisVoice): number {
  let score = 0;
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();

  // Must be Spanish
  if (!lang.startsWith('es') && !lang.includes('spanish')) {
    return -200;
  }

  // 1. Natural / Neural / Premium indicators (Modern AI voices)
  if (name.includes('natural') || name.includes('neural')) score += 60;
  if (name.includes('online')) score += 30;
  if (name.includes('google')) score += 35;
  if (name.includes('premium') || name.includes('enhanced') || name.includes('siri')) score += 45;
  if (name.includes('multilingual')) score += 20;

  // 2. Penalize robotic legacy offline voices
  if (name.includes('desktop')) score -= 30;
  if (name.includes('espeak')) score -= 60;
  if (name.includes('compact')) score -= 20;

  // 3. Dialect preferences: Argentine / Latam preferred
  if (lang.includes('ar') || name.includes('argentina') || name.includes('tomas') || name.includes('paloma')) score += 25;
  else if (lang.includes('419') || lang.includes('mx') || lang.includes('us')) score += 15;
  else if (lang.includes('es')) score += 10;

  // Remote neural service
  if (v.localService === false) score += 20;

  return score;
}

export function isNaturalVoice(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  return (
    n.includes('natural') ||
    n.includes('neural') ||
    n.includes('google') ||
    n.includes('siri') ||
    n.includes('premium') ||
    n.includes('enhanced') ||
    n.includes('online') ||
    v.localService === false
  );
}

export function getAvailableSpanishVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  const allVoices = window.speechSynthesis.getVoices();
  const spanish = allVoices.filter(v => {
    const l = v.lang.toLowerCase();
    return l.startsWith('es') || l.includes('spanish');
  });

  return spanish.sort((a, b) => scoreSpanishVoice(b) - scoreSpanishVoice(a));
}

export function getBestSpanishVoice(targetUri?: string): SpeechSynthesisVoice | null {
  const voices = getAvailableSpanishVoices();
  if (voices.length === 0) return null;

  const preferredUri = targetUri || getSavedVoiceUri();
  if (preferredUri) {
    const found = voices.find(v => v.voiceURI === preferredUri || v.name === preferredUri);
    if (found) return found;
  }

  // Return top scored voice
  return voices[0] || null;
}

export function subscribeVoicesChanged(callback: (voices: SpeechSynthesisVoice[]) => void): () => void {
  if (!isSpeechSynthesisSupported()) return () => {};

  const handler = () => {
    callback(getAvailableSpanishVoices());
  };

  // Run once immediately
  const initial = getAvailableSpanishVoices();
  if (initial.length > 0) {
    callback(initial);
  }

  window.speechSynthesis.addEventListener('voiceschanged', handler);
  return () => {
    window.speechSynthesis.removeEventListener('voiceschanged', handler);
  };
}

export function speakPrompt(text: string, onEnd?: () => void, targetVoiceUri?: string): () => void {
  if (!isSpeechSynthesisSupported()) {
    if (onEnd) onEnd();
    return () => {};
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);

    const voice = getBestSpanishVoice(targetVoiceUri);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'es-AR';
    }

    const savedRate = getSavedVoiceRate();
    utterance.rate = savedRate;
    utterance.pitch = 1.0;

    let hasEnded = false;
    const safeEnd = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (onEnd) onEnd();
      }
    };

    utterance.onend = safeEnd;
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      safeEnd();
    };

    window.speechSynthesis.speak(utterance);
    return () => {
      safeEnd();
      window.speechSynthesis.cancel();
    };
  } catch (err) {
    console.error('TTS error:', err);
    if (onEnd) onEnd();
    return () => {};
  }
}

export function testVoice(voice: SpeechSynthesisVoice, sampleText?: string, rate?: number): () => void {
  if (!isSpeechSynthesisSupported()) return () => {};

  try {
    window.speechSynthesis.cancel();
    const text = sampleText || 'Hola Doctor. Esta es mi voz para guiarlo paso a paso en el quirófano.';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate !== undefined ? rate : getSavedVoiceRate();
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
    return () => {
      window.speechSynthesis.cancel();
    };
  } catch (err) {
    console.error('Error testing voice:', err);
    return () => {};
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

// Voice Data Parsers & Cleaners for clinical fields
const SPANISH_NUMBERS: Record<string, number> = {
  cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, dieciséis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintidós: 22, veintitres: 23, veintitrés: 23, veinticuatro: 24, veinticinco: 25,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100
};

export function parseVoiceNumber(text: string): number | undefined {
  if (!text) return undefined;
  // 1. Check direct digits in string
  const digitMatch = text.match(/\d+/);
  if (digitMatch) {
    const n = parseInt(digitMatch[0], 10);
    if (!isNaN(n)) return n;
  }

  // 2. Check spanish number words
  const clean = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const words = clean.split(/\s+/);
  
  // Try single word
  for (const w of words) {
    if (SPANISH_NUMBERS[w] !== undefined) {
      return SPANISH_NUMBERS[w];
    }
  }

  // Compound like "treinta y cinco"
  if (words.length >= 3 && words[1] === 'y') {
    const tens = SPANISH_NUMBERS[words[0]];
    const units = SPANISH_NUMBERS[words[2]];
    if (tens !== undefined && units !== undefined) {
      return tens + units;
    }
  }

  return undefined;
}

export function parseVoiceDni(text: string): string {
  if (!text) return '';
  // Remove words like "DNI", "número", "cédula", dots, commas
  const onlyDigits = text.replace(/\D/g, '');
  if (onlyDigits.length >= 6) {
    return onlyDigits;
  }
  // Fallback: clean text capitalized
  return text.replace(/[.,]/g, '').trim();
}

export function cleanVoiceSentence(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  // Capitalize first letter
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}


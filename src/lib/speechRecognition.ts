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

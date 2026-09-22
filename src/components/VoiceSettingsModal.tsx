import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Play,
  Square,
  Sliders,
  Smartphone,
  Info
} from 'lucide-react';
import {
  getAvailableSpanishVoices,
  getBestSpanishVoice,
  getSavedVoiceUri,
  savePreferredVoiceUri,
  getSavedVoiceRate,
  savePreferredVoiceRate,
  isNaturalVoice,
  testVoice,
  stopSpeaking,
  subscribeVoicesChanged
} from '../lib/speechRecognition';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedUri, setSelectedUri] = useState<string>('');
  const [rate, setRate] = useState<number>(0.98);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [showOnlyNatural, setShowOnlyNatural] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setPlayingUri(null);
      return;
    }

    const available = getAvailableSpanishVoices();
    setVoices(available);

    const savedUri = getSavedVoiceUri();
    const best = getBestSpanishVoice(savedUri || undefined);
    if (savedUri && available.some(v => v.voiceURI === savedUri || v.name === savedUri)) {
      setSelectedUri(savedUri);
    } else if (best) {
      setSelectedUri(best.voiceURI || best.name);
    }

    setRate(getSavedVoiceRate());

    // Subscribe to browser voice load events (for Chrome/Safari async loads)
    const unsubscribe = subscribeVoicesChanged((loadedVoices) => {
      setVoices(loadedVoices);
      if (!selectedUri && loadedVoices.length > 0) {
        const top = getBestSpanishVoice();
        if (top) setSelectedUri(top.voiceURI || top.name);
      }
    });

    return () => {
      unsubscribe();
      stopSpeaking();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = (voice: SpeechSynthesisVoice) => {
    const uri = voice.voiceURI || voice.name;
    if (playingUri === uri) {
      stopSpeaking();
      setPlayingUri(null);
      return;
    }

    setPlayingUri(uri);
    testVoice(voice, 'Hola Doctor. Esta es mi voz natural para guiarlo en quirófano.', rate);
    // Reset playing state after typical duration
    setTimeout(() => {
      setPlayingUri(null);
    }, 3800);
  };

  const handleSave = () => {
    if (selectedUri) {
      savePreferredVoiceUri(selectedUri);
    }
    savePreferredVoiceRate(rate);
    stopSpeaking();
    if (onSaved) onSaved();
    onClose();
  };

  const formatVoiceName = (name: string): string => {
    return name
      .replace(/Microsoft\s+/i, '')
      .replace(/Online\s*\(Natural\)\s*-\s*/i, '')
      .replace(/Desktop\s*-\s*/i, '')
      .replace(/Google\s+/i, 'Google ')
      .trim();
  };

  const getCountryBadge = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes('ar')) return { flag: '🇦🇷', label: 'Argentina' };
    if (l.includes('mx')) return { flag: '🇲🇽', label: 'México' };
    if (l.includes('419')) return { flag: '🌎', label: 'Latinoamérica' };
    if (l.includes('us')) return { flag: '🇺🇸', label: 'EE.UU. / Neutral' };
    if (l.includes('es')) return { flag: '🇪🇸', label: 'España' };
    return { flag: '🌐', label: 'Español' };
  };

  const filteredVoices = voices.filter(v => {
    if (!showOnlyNatural) return true;
    return isNaturalVoice(v);
  });

  const displayVoices = filteredVoices.length > 0 ? filteredVoices : voices;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Voz del Asistente</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Menos Robótica
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona una voz humana, natural y fluida para el quirófano
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* iOS / iPhone Tip */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/80 rounded-2xl p-3.5 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-xs text-sky-950 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span>¿Usas iPhone / iPad?</span>
                <span className="bg-sky-200/70 text-sky-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">Consejo Pro</span>
              </div>
              <p className="text-sky-800 leading-relaxed text-[11px]">
                En tu iPhone puedes activar las <strong>voces humanas de Siri</strong>:
                Ve a <em>Ajustes de iPhone &gt; Accesibilidad &gt; Contenido Leído &gt; Voces &gt; Español</em> y descarga la versión <strong>"Mejorada"</strong> de <em>Mónica</em>, <em>Paulina</em> o <em>Jorge</em>. Sonarán con máxima calidad de estudio.
              </p>
            </div>
          </div>

          {/* Speed Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                <span>Velocidad de Dicción:</span>
              </span>
              <span className="font-mono text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                {rate === 0.9 ? '0.9x (Pausado)' : rate === 0.98 ? '1.0x (Natural)' : `${rate}x`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Pausado', val: 0.9, desc: 'Muy claro' },
                { label: 'Natural', val: 0.98, desc: 'Recomendado' },
                { label: 'Rápido', val: 1.1, desc: 'Dinámico' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setRate(opt.val)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center transition ${
                    rate === opt.val
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`text-[10px] font-normal ${rate === opt.val ? 'text-teal-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Voices list controls */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Voces Disponibles ({displayVoices.length})
            </span>
            <label className="inline-flex items-center space-x-1.5 cursor-pointer text-xs text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={showOnlyNatural}
                onChange={(e) => setShowOnlyNatural(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
              />
              <span>Sólo Voces Naturales</span>
            </label>
          </div>

          {/* Voices List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {displayVoices.length === 0 ? (
              <div className="text-center p-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                Cargando voces del dispositivo... si no aparecen, asegúrate de tener activada la síntesis en tu navegador.
              </div>
            ) : (
              displayVoices.map((v) => {
                const uri = v.voiceURI || v.name;
                const isSelected = selectedUri === uri || (!selectedUri && v === displayVoices[0]);
                const isNatural = isNaturalVoice(v);
                const badge = getCountryBadge(v.lang);
                const isPlaying = playingUri === uri;

                return (
                  <div
                    key={uri}
                    onClick={() => setSelectedUri(uri)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-400 ring-2 ring-teal-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Selection radio */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {formatVoiceName(v.name)}
                          </span>
                          {isNatural && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full shrink-0 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              Natural
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                          <span>{badge.flag} {badge.label}</span>
                          <span>•</span>
                          <span>{v.lang}</span>
                          {v.localService === false && (
                            <>
                              <span>•</span>
                              <span className="text-teal-600 font-semibold">Red Neuronal HD</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTest(v);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 shrink-0 transition ${
                        isPlaying
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={isPlaying ? 'Detener prueba' : 'Escuchar muestra de voz'}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span className="text-[11px] hidden sm:inline">Parar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="text-[11px] hidden sm:inline">Probar</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 italic">
            Se recordará en tu dispositivo
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-98 transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar y Usar Voz</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

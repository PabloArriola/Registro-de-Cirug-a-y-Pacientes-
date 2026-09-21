import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Camera,
  Upload,
  Calendar,
  Clock,
  User,
  Users,
  DollarSign,
  FileText,
  Trash2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Surgery, Patient, DoctorProfile, AttachedMedia, CurrencyType, PaymentMethod, PaymentStatus, SurgeryStatus } from '../types';
import { createSpeechRecognizer, isSpeechRecognitionSupported, isInIframe, openInStandaloneWindow, parseVoiceNumber, cleanVoiceSentence } from '../lib/speechRecognition';
import { FieldMicButton } from './FieldMicButton';
import { VoiceGuidedAssistant, VoiceStep } from './VoiceGuidedAssistant';

interface SurgeryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (surgery: Surgery) => void;
  patients: Patient[];
  profile: DoctorProfile;
  initialSurgery?: Surgery | null;
  onQuickAddPatient?: () => void;
}

const COMMON_SURGERIES = [
  'Colecistectomía Laparoscópica',
  'Hernioplastía Inguinal Lichtenstein',
  'Apendicectomía Laparoscópica',
  'Eventroplastía con Malla',
  'Biopsia y Exéresis de Lesión',
  'Laparotomía Exploradora',
  'Hemorroidectomía / Fisura Anal',
];

export const SurgeryFormModal: React.FC<SurgeryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patients,
  profile,
  initialSurgery,
  onQuickAddPatient,
}) => {
  // Form State
  const [pacienteId, setPacienteId] = useState(initialSurgery?.pacienteId || (patients[0]?.id || ''));
  const [tipoCirugia, setTipoCirugia] = useState(initialSurgery?.tipoCirugia || '');
  const [fechaCirugia, setFechaCirugia] = useState(() => {
    if (initialSurgery?.fechaCirugia) {
      return initialSurgery.fechaCirugia.slice(0, 16);
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [lugar, setLugar] = useState(initialSurgery?.lugar || profile.clinicaHabitual || 'Quirófano Central');
  const [estado, setEstado] = useState<SurgeryStatus>(initialSurgery?.estado || 'Realizada');

  // Medical Team Section State
  const [showTeamSection, setShowTeamSection] = useState(
    Boolean(initialSurgery?.equipoMedico?.ayudante || initialSurgery?.equipoMedico?.anestesista)
  );
  const [ayudante, setAyudante] = useState(initialSurgery?.equipoMedico?.ayudante || '');
  const [anestesista, setAnestesista] = useState(initialSurgery?.equipoMedico?.anestesista || '');
  const [instrumentadora, setInstrumentadora] = useState(initialSurgery?.equipoMedico?.instrumentadora || '');

  // Protocol & Voice Dictation State
  const [protocoloQuirurgico, setProtocoloQuirurgico] = useState(initialSurgery?.protocoloQuirurgico || '');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [interimText, setInterimText] = useState('');
  const [dictationMode, setDictationMode] = useState<'append' | 'replace'>('append');

  // Voice Assistant
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

  // Multimedia
  const [fotosPostOp, setFotosPostOp] = useState<AttachedMedia[]>(initialSurgery?.fotosPostOp || []);
  const [diasControlAlerta, setDiasControlAlerta] = useState<number>(initialSurgery?.diasControlAlerta || 7);

  // Financial Section State
  const [moneda, setMoneda] = useState<CurrencyType>(initialSurgery?.finanzas?.moneda || 'USD');
  const [montoBruto, setMontoBruto] = useState<number>(initialSurgery?.finanzas?.montoBruto || 1200);
  const [pagoEquipo, setPagoEquipo] = useState<number>(initialSurgery?.finanzas?.pagoEquipo || 300);
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>(initialSurgery?.finanzas?.metodoPago || 'Obra Social');
  const [entidadPago, setEntidadPago] = useState(initialSurgery?.finanzas?.entidadPago || 'OSDE');
  const [estadoPago, setEstadoPago] = useState<PaymentStatus>(initialSurgery?.finanzas?.estadoPago || 'Pendiente');
  const [estadoPagoEquipo, setEstadoPagoEquipo] = useState<'Pendiente' | 'Pagado'>(
    initialSurgery?.finanzas?.estadoPagoEquipo || 'Pendiente'
  );
  const [notasFinancieras, setNotasFinancieras] = useState(initialSurgery?.finanzas?.notasFinancieras || '');

  // Synchronize state when initialSurgery or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setPacienteId(initialSurgery?.pacienteId || (patients[0]?.id || ''));
      setTipoCirugia(initialSurgery?.tipoCirugia || '');
      if (initialSurgery?.fechaCirugia) {
        setFechaCirugia(initialSurgery.fechaCirugia.slice(0, 16));
      } else {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setFechaCirugia(now.toISOString().slice(0, 16));
      }
      setLugar(initialSurgery?.lugar || profile.clinicaHabitual || 'Quirófano Central');
      setEstado(initialSurgery?.estado || 'Realizada');
      setShowTeamSection(Boolean(initialSurgery?.equipoMedico?.ayudante || initialSurgery?.equipoMedico?.anestesista));
      setAyudante(initialSurgery?.equipoMedico?.ayudante || '');
      setAnestesista(initialSurgery?.equipoMedico?.anestesista || '');
      setInstrumentadora(initialSurgery?.equipoMedico?.instrumentadora || '');
      setProtocoloQuirurgico(initialSurgery?.protocoloQuirurgico || '');
      setFotosPostOp(initialSurgery?.fotosPostOp || []);
      setDiasControlAlerta(initialSurgery?.diasControlAlerta || 7);
      setMoneda(initialSurgery?.finanzas?.moneda || 'USD');
      setMontoBruto(initialSurgery?.finanzas?.montoBruto || 1200);
      setPagoEquipo(initialSurgery?.finanzas?.pagoEquipo || 300);
      setMetodoPago(initialSurgery?.finanzas?.metodoPago || 'Obra Social');
      setEntidadPago(initialSurgery?.finanzas?.entidadPago || 'OSDE');
      setEstadoPago(initialSurgery?.finanzas?.estadoPago || 'Pendiente');
      setEstadoPagoEquipo(initialSurgery?.finanzas?.estadoPagoEquipo || 'Pendiente');
      setNotasFinancieras(initialSurgery?.finanzas?.notasFinancieras || '');
    }
  }, [isOpen, initialSurgery, patients, profile]);

  // Calculated Net Profit
  const gananciaNeta = Math.max(0, (montoBruto || 0) - (pagoEquipo || 0));

  // Speech recognizer instance
  const [recognizer, setRecognizer] = useState<{ start: () => void; stop: () => void; isSupported: boolean } | null>(null);

  useEffect(() => {
    const rec = createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal) {
          setProtocoloQuirurgico(prev => {
            if (dictationMode === 'append') {
              return prev ? `${prev.trim()}\n${transcript}` : transcript;
            }
            return transcript;
          });
          setInterimText('');
        } else {
          setInterimText(transcript);
        }
      },
      (error) => {
        setSpeechError(error);
        setIsRecording(false);
      },
      (recording) => {
        setIsRecording(recording);
        if (recording) setSpeechError('');
      }
    );
    setRecognizer(rec);

    return () => {
      if (rec) rec.stop();
    };
  }, [dictationMode]);

  const handleToggleMic = () => {
    if (!recognizer) return;
    if (isRecording) {
      recognizer.stop();
    } else {
      setSpeechError('');
      recognizer.start();
    }
  };

  // Quick Template Injector for Speech/Text Testing
  const handleApplyTemplate = (templateType: 'cole' | 'hernia' | 'apendice') => {
    let tpl = '';
    if (templateType === 'cole') {
      tpl = `Colecistectomía Laparoscópica:
- Neumoperitoneo técnica abierta Hasson umbilical a 12 mmHg.
- Colocación de 4 trocares (umbilical, epigástrico, dos en hipocondrio derecho).
- Hallazgos: Vesícula biliar alitiásica/litiásica, paredes delgadas sin signos de peritonitis.
- Disección de Calot hasta obtener Visión Crítica de Seguridad de Strasberg.
- Triple clipado de conducto cístico y doble de arteria cística, con sección fría.
- Colecistectomía retrógrada con hook monopolar. Hemostasia prolija del lecho.
- Extracción protegida en endobag umbilical. Cierre por planos. Sin incidentes.`;
    } else if (templateType === 'hernia') {
      tpl = `Hernioplastía Inguinal técnica Lichtenstein:
- Anestesia raquídea / local asistida. Incisión inguinal derecha oblicua.
- Apertura aponeurótica del oblicuo mayor, aislamiento de cordón espermático.
- Disección de saco herniario indirecto con reducción al espacio preperitoneal.
- Colocación de malla de polipropileno de 7,5 x 15 cm fijada al pubis con prolene 2-0 y arcada crural.
- Confección de ojal para cordón. Cierre por planos con síntesis intradérmica.`;
    } else {
      tpl = `Apendicectomía Laparoscópica:
- Abordaje laparoscópico estándar con 3 trocares.
- Hallazgos: Apéndice cecal engrosado, flegmonoso con exudado fibrinoso.
- Esqueletización de mesoapéndice con electrocoagulación y clips.
- Doble lazo Endoloop en base apendicular y sección.
- Lavado y aspiración de fondo de saco de Douglas. Extracción en bolsa.`;
    }
    setProtocoloQuirurgico(prev => (prev ? `${prev.trim()}\n\n${tpl}` : tpl));
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newMedia: AttachedMedia = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            url: event.target.result as string,
            titulo: file.name.replace(/\.[^/.]+$/, ''),
            categoria: 'intraoperatorio',
            fecha: new Date().toISOString().split('T')[0],
          };
          setFotosPostOp(prev => [...prev, newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    setFotosPostOp(prev => prev.filter(f => f.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPatient = patients.find(p => p.id === pacienteId);
    if (!selectedPatient) {
      alert('Por favor selecciona un paciente o añade uno nuevo.');
      return;
    }
    if (!tipoCirugia.trim()) {
      alert('Ingresa el tipo de procedimiento o cirugía.');
      return;
    }

    const calculatedAlertDate = new Date(fechaCirugia);
    calculatedAlertDate.setDate(calculatedAlertDate.getDate() + (diasControlAlerta || 7));

    const updatedSurgery: Surgery = {
      id: initialSurgery?.id || `surg-${Date.now()}`,
      pacienteId: selectedPatient.id,
      pacienteNombre: selectedPatient.nombreCompleto,
      pacienteDni: selectedPatient.dni,
      tipoCirugia: tipoCirugia.trim(),
      fechaCirugia: new Date(fechaCirugia).toISOString(),
      lugar: lugar.trim() || profile.clinicaHabitual || 'Quirófano Central',
      estado,
      equipoMedico: {
        ayudante: ayudante.trim() || undefined,
        anestesista: anestesista.trim() || undefined,
        instrumentadora: instrumentadora.trim() || undefined,
      },
      protocoloQuirurgico: protocoloQuirurgico.trim(),
      fotosPostOp,
      diasControlAlerta,
      fechaControlAlerta: calculatedAlertDate.toISOString().split('T')[0],
      finanzas: {
        moneda,
        montoBruto: Number(montoBruto) || 0,
        pagoEquipo: Number(pagoEquipo) || 0,
        gananciaNeta,
        metodoPago,
        entidadPago: entidadPago.trim() || 'Particular',
        estadoPago,
        fechaCobroReal: estadoPago === 'Cobrado' ? (initialSurgery?.finanzas?.fechaCobroReal || new Date().toISOString().split('T')[0]) : undefined,
        estadoPagoEquipo,
        fechaPagoEquipo: estadoPagoEquipo === 'Pagado' ? (initialSurgery?.finanzas?.fechaPagoEquipo || new Date().toISOString().split('T')[0]) : undefined,
        notasFinancieras: notasFinancieras.trim() || undefined,
      },
      creadoEl: initialSurgery?.creadoEl || new Date().toISOString(),
    };

    onSave(updatedSurgery);
    onClose();
  };

  const surgeryVoiceSteps: VoiceStep[] = [
    {
      id: 'tipoCirugia',
      fieldLabel: 'Tipo de Cirugía / Procedimiento',
      promptQuestion: '¿Qué procedimiento o cirugía realizaste?',
      helperText: 'Ej: Colecistectomía laparoscópica, hernioplastía inguinal, apendicectomía',
      currentValue: tipoCirugia,
      onApply: (val) => setTipoCirugia(cleanVoiceSentence(val)),
    },
    {
      id: 'lugar',
      fieldLabel: 'Lugar / Centro Quirúrgico',
      promptQuestion: '¿En qué clínica, sanatorio o quirófano se realizó?',
      helperText: 'Ej: Quirófano Central, Sanatorio Trinidad, Hospital Italiano',
      currentValue: lugar,
      onApply: (val) => setLugar(cleanVoiceSentence(val)),
    },
    {
      id: 'ayudante',
      fieldLabel: 'Cirujano Ayudante',
      promptQuestion: '¿Quién fue el primer ayudante médico?',
      helperText: 'Ej: Dr. Pérez, Dra. Gómez, o di "ninguno" si operaste solo',
      currentValue: ayudante,
      onApply: (val) => {
        const cleaned = cleanVoiceSentence(val);
        if (!cleaned.toLowerCase().includes('ningun') && !cleaned.toLowerCase().includes('solo')) {
          setAyudante(cleaned);
          setShowTeamSection(true);
        }
      },
    },
    {
      id: 'anestesista',
      fieldLabel: 'Anestesiólogo / Anestesia',
      promptQuestion: '¿Quién fue el o la médica anestesióloga?',
      helperText: 'Ej: Dr. Rossi, o di "local", "raquídea"',
      currentValue: anestesista,
      onApply: (val) => {
        const cleaned = cleanVoiceSentence(val);
        if (!cleaned.toLowerCase().includes('ningun')) {
          setAnestesista(cleaned);
          setShowTeamSection(true);
        }
      },
    },
    {
      id: 'protocoloQuirurgico',
      fieldLabel: 'Protocolo Quirúrgico',
      promptQuestion: 'Dicta un resumen del protocolo o hallazgos quirúrgicos:',
      helperText: 'Puedes dictar hallazgos, pasos principales, biopsias o incidentes',
      currentValue: protocoloQuirurgico,
      isMultiline: true,
      onApply: (val) => {
        const cleaned = cleanVoiceSentence(val);
        setProtocoloQuirurgico(prev => prev ? `${prev.trim()}\n${cleaned}` : cleaned);
      },
    },
    {
      id: 'montoBruto',
      fieldLabel: 'Honorarios Totales Brutos',
      promptQuestion: '¿Cuál es el monto total bruto de honorarios pactados?',
      helperText: 'Di el importe, ej: mil doscientos o 1500',
      currentValue: montoBruto ? String(montoBruto) : '',
      onApply: (val) => {
        const num = parseVoiceNumber(val);
        if (num !== undefined) setMontoBruto(num);
      },
    },
    {
      id: 'pagoEquipo',
      fieldLabel: 'Pago a Equipo Quirúrgico',
      promptQuestion: '¿Cuánto corresponde pagar a tu ayudante o equipo?',
      helperText: 'Di el número o di "cero" si no hay pago al equipo',
      currentValue: pagoEquipo ? String(pagoEquipo) : '',
      onApply: (val) => {
        const num = parseVoiceNumber(val);
        if (num !== undefined) setPagoEquipo(num);
      },
    },
    {
      id: 'entidadPago',
      fieldLabel: 'Entidad de Pago o Cobertura',
      promptQuestion: '¿Cuál es la obra social, prepaga o modalidad de cobro?',
      helperText: 'Ej: Particular, OSDE, Swiss Medical, Galeno',
      currentValue: entidadPago,
      onApply: (val) => setEntidadPago(cleanVoiceSentence(val)),
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>{initialSurgery ? 'Editar Cirugía' : 'Nueva Intervención Quirúrgica'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Carga rápida adaptada al flujo de quirófano con dictado por voz y finanzas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Voice Guided Assistant Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-teal-950 block">Carga Rápida de Cirugía por Voz</span>
                <span className="text-[11px] text-teal-700">Te guiaremos dictando paso a paso los datos quirúrgicos y honorarios</span>
              </div>
            </div>
            <button
              id="btn-voice-surgery-guide"
              type="button"
              onClick={() => setIsVoiceAssistantOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-98 transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Iniciar Carga Guiada</span>
            </button>
          </div>

          {/* SECTION 1: Identificación y Tiempo */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center">1</span>
                Identificación y Tiempo
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Obligatorio</span>
            </div>

            {/* Patient Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paciente Vinculado
              </label>
              <div className="flex gap-2">
                <select
                  id="select-surgery-patient"
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                >
                  {patients.length === 0 && <option value="">No hay pacientes registrados</option>}
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombreCompleto} — DNI: {p.dni} ({p.obraSocial})
                    </option>
                  ))}
                </select>
                {onQuickAddPatient && (
                  <button
                    type="button"
                    onClick={onQuickAddPatient}
                    className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs border border-teal-200 transition"
                  >
                    + Nuevo
                  </button>
                )}
              </div>
            </div>

            {/* Surgery Type & Quick Tag Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Tipo de Cirugía / Procedimiento <span className="text-rose-500">*</span>
                </label>
                <FieldMicButton onCapture={(val) => setTipoCirugia(cleanVoiceSentence(val))} title="Dictar tipo de cirugía" />
              </div>
              <input
                id="input-surgery-type"
                type="text"
                value={tipoCirugia}
                onChange={(e) => setTipoCirugia(e.target.value)}
                placeholder="Ej: Colecistectomía Laparoscópica"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_SURGERIES.map(surg => (
                  <button
                    key={surg}
                    type="button"
                    onClick={() => setTipoCirugia(surg)}
                    className="text-[11px] bg-slate-200/70 hover:bg-teal-100 hover:text-teal-900 text-slate-700 px-2 py-0.5 rounded-md font-medium transition"
                  >
                    + {surg}
                  </button>
                ))}
              </div>
            </div>

            {/* Date, Time and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha y Hora de Quirófano
                </label>
                <input
                  type="datetime-local"
                  value={fechaCirugia}
                  onChange={(e) => setFechaCirugia(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                >
                </input>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Lugar / Centro Quirúrgico
                  </label>
                  <FieldMicButton onCapture={(val) => setLugar(cleanVoiceSentence(val))} title="Dictar lugar / sanatorio" />
                </div>
                <input
                  type="text"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  placeholder="Clínica / Quirófano"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado Quirúrgico
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as SurgeryStatus)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Programada">📅 Programada</option>
                  <option value="Realizada">✅ Realizada</option>
                  <option value="Post-Op">🩺 Post-Operatorio</option>
                  <option value="Suspendida">❌ Suspendida</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Equipo Médico (Colapsable / Toggle) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowTeamSection(!showTeamSection)}
                className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900"
              >
                <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-800 text-[10px] flex items-center justify-center">2</span>
                <span>Equipo Quirúrgico (Opcional)</span>
                {showTeamSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTeamSection}
                  onChange={(e) => setShowTeamSection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {showTeamSection && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Ayudante (Cirujano)
                    </label>
                    <FieldMicButton onCapture={(val) => setAyudante(cleanVoiceSentence(val))} title="Dictar ayudante" />
                  </div>
                  <input
                    type="text"
                    value={ayudante}
                    onChange={(e) => setAyudante(e.target.value)}
                    placeholder="Dr./Dra. Ayudante"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Anestesiólogo/a
                    </label>
                    <FieldMicButton onCapture={(val) => setAnestesista(cleanVoiceSentence(val))} title="Dictar anestesiólogo" />
                  </div>
                  <input
                    type="text"
                    value={anestesista}
                    onChange={(e) => setAnestesista(e.target.value)}
                    placeholder="Dr./Dra. Anestesista"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Instrumentadora
                    </label>
                    <FieldMicButton onCapture={(val) => setInstrumentadora(cleanVoiceSentence(val))} title="Dictar instrumentadora" />
                  </div>
                  <input
                    type="text"
                    value={instrumentadora}
                    onChange={(e) => setInstrumentadora(e.target.value)}
                    placeholder="Lic./Enf. Instrumentadora"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Protocolo Quirúrgico y Multimedia */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center">3</span>
                Protocolo Quirúrgico y Multimedia
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">Modo dictado:</span>
                <button
                  type="button"
                  onClick={() => setDictationMode(dictationMode === 'append' ? 'replace' : 'append')}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold"
                >
                  {dictationMode === 'append' ? 'Añadir al final' : 'Reemplazar'}
                </button>
              </div>
            </div>

            {/* Voice Dictation Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  id="btn-voice-dictation-toggle"
                  type="button"
                  onClick={handleToggleMic}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/30'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isRecording ? 'Detener Dictado' : 'Dictar por Voz (Español)'}</span>
                </button>

                {isRecording && (
                  <div className="flex items-center space-x-1.5 text-xs text-rose-600 font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>Escuchando protocolo...</span>
                  </div>
                )}
              </div>

              {/* Template shortcuts */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Plantillas:</span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('cole')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded"
                >
                  Colecistectomía
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('hernia')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded"
                >
                  Hernia
                </button>
              </div>
            </div>

            {speechError && (
              <div className="text-xs bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    {speechError === 'mic_iframe_blocked' ? (
                      <>
                        <p className="font-semibold text-rose-900">
                          Dictado bloqueado por seguridad del navegador (Modo Vista Previa)
                        </p>
                        <p className="text-rose-700 leading-relaxed">
                          Por políticas de seguridad, los navegadores (Chrome, Edge, Safari) no permiten acceder al micrófono dentro de marcos o paneles embebidos (iframes). Para dictar los protocolos quirúrgicos por voz, abre la aplicación directamente en una pestaña nueva del navegador:
                        </p>
                      </>
                    ) : speechError === 'mic_denied_browser' ? (
                      <>
                        <p className="font-semibold text-rose-900">
                          Permiso de micrófono bloqueado en tu navegador
                        </p>
                        <p className="text-rose-700 leading-relaxed">
                          El navegador tiene bloqueado el acceso al micrófono para este sitio. Haz clic en el ícono del candado o configuración al lado de la barra de direcciones (URL), busca <strong>Micrófono</strong> y selecciona <strong>Permitir</strong>, luego recarga la página.
                        </p>
                      </>
                    ) : (
                      <p className="text-rose-700">{speechError}</p>
                    )}
                  </div>
                </div>

                {isInIframe() && (
                  <div className="pt-1 flex flex-wrap items-center gap-2 border-t border-rose-200/60">
                    <button
                      type="button"
                      onClick={() => openInStandaloneWindow()}
                      className="inline-flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir aplicación en nueva pestaña para dictar</span>
                    </button>
                    <span className="text-[11px] text-rose-600">
                      (Al abrirse en pestaña completa, el navegador te consultará "¿Permitir uso del micrófono?")
                    </span>
                  </div>
                )}
              </div>
            )}

            {interimText && (
              <div className="text-xs text-slate-500 bg-amber-50/80 border border-amber-200 p-2 rounded-lg italic">
                Transcripción en vivo: "{interimText}"
              </div>
            )}

            {/* Main Protocol Textarea */}
            <div>
              <textarea
                id="textarea-surgical-protocol"
                rows={5}
                value={protocoloQuirurgico}
                onChange={(e) => setProtocoloQuirurgico(e.target.value)}
                placeholder="Escribe o dicta aquí el protocolo quirúrgico (hallazgos, técnica, hemostasia, biopsias, incidentes)..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 font-mono leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Photos & Multimedia */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Camera className="w-4 h-4 text-teal-600" />
                  Fotos de Quirófano / Piezas Quirúrgicas / Herida
                </label>
                <label className="cursor-pointer inline-flex items-center space-x-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Añadir Fotos</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {fotosPostOp.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {fotosPostOp.map((photo) => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-sm">
                      <img src={photo.url} alt={photo.titulo} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute top-1 right-1 bg-rose-600/90 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition shadow"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                        <span className="text-[10px] text-white font-medium truncate block">
                          {photo.titulo || 'Foto quirúrgica'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Sin fotos adjuntas para esta cirugía. Puedes cargar fotos de la cámara o galería.
                </p>
              )}
            </div>

            {/* Post-Op Follow-up Alert Setting */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-700">
                Alarma de Control Post-Op:
              </span>
              <div className="flex space-x-1.5">
                {[7, 15, 30].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDiasControlAlerta(days)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      diasControlAlerta === days
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {days} días
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: Detalle Financiero (La Caja) */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">4</span>
                Detalle Financiero y Honorarios
              </h3>

              {/* Currency Switch: USD vs Local */}
              <div className="flex items-center bg-white border border-emerald-300 rounded-xl p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMoneda('USD')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    moneda === 'USD'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setMoneda('LOCAL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    moneda === 'LOCAL'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {profile.monedaLocalNombre || 'Moneda Local'}
                </button>
              </div>
            </div>

            {/* Financial Numbers: Gross, Team, Net */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Monto Total Bruto ({moneda === 'USD' ? 'USD' : profile.monedaLocalSimbolo})
                  </label>
                  <FieldMicButton
                    onCapture={(val) => {
                      const num = parseVoiceNumber(val);
                      if (num !== undefined) setMontoBruto(num);
                    }}
                    title="Dictar monto bruto"
                  />
                </div>
                <input
                  id="input-monto-bruto"
                  type="number"
                  min="0"
                  step="any"
                  value={montoBruto || ''}
                  onChange={(e) => setMontoBruto(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pago a Equipo / Ayudante
                  </label>
                  <FieldMicButton
                    onCapture={(val) => {
                      const num = parseVoiceNumber(val);
                      if (num !== undefined) setPagoEquipo(num);
                    }}
                    title="Dictar pago a equipo"
                  />
                </div>
                <input
                  id="input-pago-equipo"
                  type="number"
                  min="0"
                  step="any"
                  value={pagoEquipo || ''}
                  onChange={(e) => setPagoEquipo(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Read-Only Net Profit Box */}
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">
                  Tu Ganancia Neta Real
                </label>
                <div className="w-full bg-emerald-100/90 border border-emerald-300 rounded-xl px-3 py-2 text-sm font-black text-emerald-900 flex items-center justify-between">
                  <span>{moneda === 'USD' ? '$' : profile.monedaLocalSimbolo} {gananciaNeta.toLocaleString('es-AR')}</span>
                  <span className="text-[10px] font-semibold uppercase text-emerald-700">Neto</span>
                </div>
              </div>
            </div>

            {/* Payment Method, Entity & Collection Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de Cobro
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as PaymentMethod)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Particular">Particular (Efectivo/Transf.)</option>
                  <option value="Obra Social">Obra Social</option>
                  <option value="Prepaga">Prepaga de Salud</option>
                  <option value="Seguro">Seguro Médico / ART</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Entidad / Nombre
                  </label>
                  <FieldMicButton onCapture={(val) => setEntidadPago(cleanVoiceSentence(val))} title="Dictar entidad de pago" />
                </div>
                <input
                  type="text"
                  value={entidadPago}
                  onChange={(e) => setEntidadPago(e.target.value)}
                  placeholder="Ej: OSDE, Swiss, Particular"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado de Cobro
                </label>
                <select
                  id="select-estado-pago"
                  value={estadoPago}
                  onChange={(e) => setEstadoPago(e.target.value as PaymentStatus)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none ${
                    estadoPago === 'Cobrado'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  <option value="Pendiente">⏳ Pendiente de Cobro</option>
                  <option value="Cobrado">💰 Cobrado / Liquidado</option>
                </select>
              </div>
            </div>

            {/* Team payment status */}
            <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-emerald-200 gap-2">
              <span className="font-semibold text-slate-700">Estado de pago a tu colega/ayudante:</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEstadoPagoEquipo('Pendiente')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    estadoPagoEquipo === 'Pendiente'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Deuda Pendiente
                </button>
                <button
                  type="button"
                  onClick={() => setEstadoPagoEquipo('Pagado')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    estadoPagoEquipo === 'Pagado'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Honorario Pagado
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              id="btn-save-surgery"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-teal-500/20 active:scale-98 transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Cirugía</span>
            </button>
          </div>
        </form>
      </div>

      {/* Voice Guided Assistant Wizard Modal */}
      <VoiceGuidedAssistant
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        title={initialSurgery ? "Actualizar Cirugía por Voz" : "Carga Guiada por Voz: Cirugía"}
        steps={surgeryVoiceSteps}
      />
    </div>
  );
};

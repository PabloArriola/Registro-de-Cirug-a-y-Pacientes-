import React, { useState } from 'react';
import { X, Printer, Share2, Copy, Check, MessageSquare, ShieldCheck } from 'lucide-react';
import { Surgery, Patient, DoctorProfile } from '../types';
import { formatDateTime, formatDateShort, generateWhatsAppReportText, getWhatsAppShareUrl } from '../lib/formatters';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgery: Surgery | null;
  patient: Patient | undefined;
  profile: DoctorProfile;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  surgery,
  patient,
  profile,
}) => {
  const [copied, setCopied] = useState(false);

  const fullWhatsAppText = surgery ? generateWhatsAppReportText(surgery, patient, profile) : '';
  const waUrl = getWhatsAppShareUrl(patient?.telefono || '', fullWhatsAppText);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(fullWhatsAppText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Error copying text', e);
    }
  };

  const handleShareWhatsApp = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen || !surgery) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:static print:bg-white print:p-0 print:block">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[94vh] print:max-w-none print:shadow-none print:border-none print:my-0 print:max-h-none print:block">
        {/* Top Action Bar (No-Print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></span>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">
                Informe Quirúrgico Digital
              </h2>
              <p className="text-[11px] text-slate-400">
                Listo para imprimir en PDF o compartir por WhatsApp con el paciente
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-report-whatsapp"
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm active:scale-95"
              title="Enviar por WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              id="btn-report-print"
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              title="Imprimir o Descargar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              id="btn-report-copy"
              type="button"
              onClick={handleCopyText}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              title="Copiar texto resumen"
            >
              {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Container */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-slate-100 flex justify-center print:overflow-visible print:bg-white print:p-0 print:block">
          <div
            id="printable-medical-report"
            className="w-full max-w-2xl bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-slate-200 text-slate-900 font-sans space-y-6 print:max-w-none print:shadow-none print:border-none print:p-0 print:space-y-4"
          >
            {/* Medical Institutional Header */}
            <div className="flex flex-wrap items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  {profile.nombre}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-teal-700 mt-0.5">
                  {profile.especialidad}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Matrícula: <span className="font-mono font-medium">{profile.matricula}</span>
                </p>
              </div>

              <div className="text-right text-xs text-slate-500">
                <p className="font-bold text-slate-800">{surgery.lugar}</p>
                <p>{profile.telefonoContacto}</p>
                <p>{profile.emailContacto}</p>
              </div>
            </div>

            {/* Document Title & Reference Code */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Protocolo Quirúrgico y Epicrisis
              </span>
              <span className="text-xs font-mono text-slate-400">
                ID REF: #{surgery.id.slice(-6).toUpperCase()}
              </span>
            </div>

            {/* Patient & Surgical Details Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Paciente</span>
                <span className="font-bold text-slate-900 text-sm">{surgery.pacienteNombre}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">DNI / Identificación</span>
                <span className="font-semibold text-slate-800">{surgery.pacienteDni}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cobertura</span>
                <span className="font-semibold text-slate-800">{surgery.finanzas.entidadPago || patient?.obraSocial || 'Particular'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha y Hora</span>
                <span className="font-semibold text-slate-800">{formatDateTime(surgery.fechaCirugia)}</span>
              </div>
            </div>

            {/* Procedure Name */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-teal-800 block">Procedimiento Realizado</span>
              <span className="font-black text-slate-950 text-base sm:text-lg">{surgery.tipoCirugia}</span>
            </div>

            {/* Medical Team */}
            {(surgery.equipoMedico.ayudante || surgery.equipoMedico.anestesista || surgery.equipoMedico.instrumentadora) && (
              <div className="text-xs space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Equipo Quirúrgico Interviniente:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {surgery.equipoMedico.ayudante && (
                    <div><span className="font-semibold text-slate-700">Ayudante:</span> {surgery.equipoMedico.ayudante}</div>
                  )}
                  {surgery.equipoMedico.anestesista && (
                    <div><span className="font-semibold text-slate-700">Anestesista:</span> {surgery.equipoMedico.anestesista}</div>
                  )}
                  {surgery.equipoMedico.instrumentadora && (
                    <div><span className="font-semibold text-slate-700">Instrumentación:</span> {surgery.equipoMedico.instrumentadora}</div>
                  )}
                </div>
              </div>
            )}

            {/* Protocol Body */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b pb-1">
                Descripción Operatoria y Hallazgos:
              </h3>
              <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-line font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {surgery.protocoloQuirurgico || 'Sin protocolo registrado.'}
              </div>
            </div>

            {/* Attached Photos (if requested to print) */}
            {surgery.fotosPostOp.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b pb-1">
                  Registro Fotográfico Intraoperatorio ({surgery.fotosPostOp.length}):
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {surgery.fotosPostOp.map((f) => (
                    <div key={f.id} className="rounded-lg overflow-hidden border border-slate-200">
                      <img src={f.url} alt={f.titulo} className="w-full h-28 object-cover" />
                      <p className="text-[10px] text-slate-600 p-1 truncate text-center font-medium bg-slate-50">
                        {f.titulo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post-Operative Indications */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block">
                Indicaciones Post-Operatorias y Cuidados:
              </span>
              <p>• Reposo domiciliario según confort y deambulación precoz supervisada.</p>
              <p>• Cura plana de heridas con gasa seca estéril y antiséptico habitual.</p>
              <p>• Analgesia según esquema indicado en receta médica.</p>
              <p>
                • <strong>Control programado:</strong> Próximo control en consultorio a los{' '}
                <strong>{surgery.diasControlAlerta} días</strong> post-intervención ({surgery.fechaControlAlerta || 'A coordinar'}).
              </p>
            </div>

            {/* Doctor Signature Block */}
            <div className="pt-8 flex justify-end">
              <div className="text-center w-56 border-t-2 border-slate-800 pt-2">
                <p className="font-bold text-xs text-slate-900">{profile.nombre}</p>
                <p className="text-[11px] text-slate-600">{profile.especialidad}</p>
                <p className="text-[10px] text-slate-500 font-mono">{profile.matricula}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

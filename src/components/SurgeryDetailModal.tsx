import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  FileText,
  Printer,
  Share2,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Surgery, Patient, DoctorProfile, SurgeryStatus } from '../types';
import { formatDateTime, formatCurrency, getWhatsAppShareUrl, generateWhatsAppReportText } from '../lib/formatters';

interface SurgeryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgery: Surgery | null;
  patient: Patient | undefined;
  profile: DoctorProfile;
  isPrivate: boolean;
  onEdit: (surgery: Surgery) => void;
  onDelete: (surgeryId: string) => void;
  onOpenReport: (surgery: Surgery) => void;
  onUpdateStatus: (surgeryId: string, newStatus: SurgeryStatus) => void;
  onTogglePaymentStatus: (surgeryId: string) => void;
  onToggleTeamPaymentStatus: (surgeryId: string) => void;
}

export const SurgeryDetailModal: React.FC<SurgeryDetailModalProps> = ({
  isOpen,
  onClose,
  surgery,
  patient,
  profile,
  isPrivate,
  onEdit,
  onDelete,
  onOpenReport,
  onUpdateStatus,
  onTogglePaymentStatus,
  onToggleTeamPaymentStatus,
}) => {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const handleWhatsAppQuick = () => {
    if (!surgery) return;
    const text = generateWhatsAppReportText(surgery, patient, profile);
    const url = getWhatsAppShareUrl(patient?.telefono || '', text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen || !surgery) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  surgery.estado === 'Realizada'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : surgery.estado === 'Programada'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : surgery.estado === 'Post-Op'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {surgery.estado}
              </span>
              <span className="text-xs text-slate-400">
                {formatDateTime(surgery.fechaCirugia)}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white mt-1">
              {surgery.tipoCirugia}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              {surgery.lugar}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onEdit(surgery)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Editar cirugía"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Eliminar el registro de ${surgery.tipoCirugia}?`)) {
                  onDelete(surgery.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 transition"
              title="Eliminar cirugía"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Patient Quick Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Paciente</span>
              <span className="text-base font-bold text-slate-900">{surgery.pacienteNombre}</span>
              <span className="text-xs text-slate-500 block">DNI: {surgery.pacienteDni} • {surgery.finanzas.entidadPago}</span>
            </div>

            <div className="flex items-center space-x-2">
              {patient?.telefono && (
                <button
                  type="button"
                  onClick={handleWhatsAppQuick}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenReport(surgery)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Ver Informe</span>
              </button>
            </div>
          </div>

          {/* Status Quick Changer */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">Cambiar estado del ciclo quirúrgico:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['Programada', 'Realizada', 'Post-Op', 'Suspendida'] as SurgeryStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onUpdateStatus(surgery.id, st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    surgery.estado === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Breakdown Card (La Caja Médica) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                Detalle Financiero de la Intervención
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {surgery.finanzas.moneda === 'USD' ? 'Dólares (USD)' : profile.monedaLocalNombre}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Bruto</span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  {formatCurrency(surgery.finanzas.montoBruto, surgery.finanzas.moneda, profile, isPrivate)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pago a Equipo</span>
                <span className="text-sm sm:text-base font-bold text-slate-700">
                  {formatCurrency(surgery.finanzas.pagoEquipo, surgery.finanzas.moneda, profile, isPrivate)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">Ganancia Neta</span>
                <span className="text-sm sm:text-base font-black text-white">
                  {formatCurrency(surgery.finanzas.gananciaNeta, surgery.finanzas.moneda, profile, isPrivate)}
                </span>
              </div>
            </div>

            {/* Quick Status Buttons for Financial Flow */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600 font-medium">Cobro Cirugía:</span>
                <button
                  type="button"
                  onClick={() => onTogglePaymentStatus(surgery.id)}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    surgery.finanzas.estadoPago === 'Cobrado'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  }`}
                >
                  {surgery.finanzas.estadoPago === 'Cobrado' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cobrado</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Pendiente de Cobro</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-600 font-medium">Pago a Ayudante:</span>
                <button
                  type="button"
                  onClick={() => onToggleTeamPaymentStatus(surgery.id)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    surgery.finanzas.estadoPagoEquipo === 'Pagado'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {surgery.finanzas.estadoPagoEquipo === 'Pagado' ? 'Colega Pagado' : 'Deuda a Colega'}
                </button>
              </div>
            </div>

            {surgery.finanzas.notasFinancieras && (
              <p className="text-xs text-slate-600 italic bg-white/70 p-2 rounded-lg">
                Nota financiera: {surgery.finanzas.notasFinancieras}
              </p>
            )}
          </div>

          {/* Surgical Team */}
          {(surgery.equipoMedico.ayudante || surgery.equipoMedico.anestesista || surgery.equipoMedico.instrumentadora) && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Equipo Médico Quirúrgico</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {surgery.equipoMedico.ayudante && (
                  <div><span className="font-semibold text-slate-700">Ayudante:</span> {surgery.equipoMedico.ayudante}</div>
                )}
                {surgery.equipoMedico.anestesista && (
                  <div><span className="font-semibold text-slate-700">Anestesista:</span> {surgery.equipoMedico.anestesista}</div>
                )}
                {surgery.equipoMedico.instrumentadora && (
                  <div><span className="font-semibold text-slate-700">Instrumentadora:</span> {surgery.equipoMedico.instrumentadora}</div>
                )}
              </div>
            </div>
          )}

          {/* Operative Protocol Text */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Protocolo Operatorio Quirúrgico</span>
              <span className="text-[10px] text-slate-400 font-normal">Dictado clínico</span>
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-line">
              {surgery.protocoloQuirurgico || 'Sin protocolo redactado aún.'}
            </div>
          </div>

          {/* Photos Gallery */}
          {surgery.fotosPostOp.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Registro Fotográfico ({surgery.fotosPostOp.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {surgery.fotosPostOp.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhotoUrl(photo.url)}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square cursor-pointer shadow-sm"
                  >
                    <img src={photo.url} alt={photo.titulo} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-semibold">
                      Ver foto
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for viewing photos in full size */}
      {selectedPhotoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <img src={selectedPhotoUrl} alt="Detalle quirúrgico" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
          <button
            type="button"
            onClick={() => setSelectedPhotoUrl(null)}
            className="absolute top-6 right-6 text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

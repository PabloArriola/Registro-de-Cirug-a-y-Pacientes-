import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Shield,
  FileText,
  Activity,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Patient, Surgery, DoctorProfile } from '../types';
import { formatDateShort, formatDateTime } from '../lib/formatters';

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  patientSurgeries: Surgery[];
  profile: DoctorProfile;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onSelectSurgery: (surgery: Surgery) => void;
  onNewSurgeryForPatient: (patient: Patient) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  isOpen,
  onClose,
  patient,
  patientSurgeries,
  profile,
  onEditPatient,
  onDeletePatient,
  onSelectSurgery,
  onNewSurgeryForPatient,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleWhatsApp = () => {
    if (!patient?.telefono) return;
    const cleanPhone = patient.telefono.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hola ${patient.nombreCompleto}, le escribe el equipo del ${profile.nombre}.`
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Historia Clínica
              </span>
              <span className="text-xs text-slate-400">
                Registrado: {formatDateShort(patient.fechaCreacion)}
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              {patient.nombreCompleto}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              DNI: <span className="font-mono font-medium text-white">{patient.dni}</span> • {patient.obraSocial} {patient.numeroAfiliado && `(#${patient.numeroAfiliado})`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onEditPatient(patient)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Editar ficha"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Seguro que deseas eliminar la ficha de ${patient.nombreCompleto}?`)) {
                  onDeletePatient(patient.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 transition"
              title="Eliminar paciente"
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

        {/* Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Contact Bar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Contacto directo: </span>
              <span className="font-bold text-slate-800">{patient.telefono || 'Sin teléfono registrado'}</span>
              {patient.edad && <span className="text-slate-500 ml-2">({patient.edad} años)</span>}
            </div>
            {patient.telefono && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contactar por WhatsApp</span>
              </button>
            )}
          </div>

          {/* Clinical Alerts: Allergies & Medications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Alergias Medicamentosas
              </span>
              <p className="text-xs font-semibold text-rose-950">
                {patient.alergias || 'Sin alergias reportadas'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                Medicación Habitual
              </span>
              <p className="text-xs font-semibold text-amber-950">
                {patient.medicacionHabitual || 'Ninguna medicación informada'}
              </p>
            </div>
          </div>

          {/* Antecedents and History Summary */}
          {patient.antecedentesMedicos && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Antecedentes Quirúrgicos y Personales
              </span>
              <p className="text-xs text-slate-800 leading-relaxed">
                {patient.antecedentesMedicos}
              </p>
            </div>
          )}

          {patient.historiaClinicaResumen && (
            <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-800 block">
                Evolución y Resumen Clínico
              </span>
              <p className="text-xs text-slate-800 leading-relaxed">
                {patient.historiaClinicaResumen}
              </p>
            </div>
          )}

          {/* Surgeries Timeline for this Patient */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                Intervenciones Quirúrgicas ({patientSurgeries.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewSurgeryForPatient(patient);
                }}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Programar Cirugía</span>
              </button>
            </div>

            {patientSurgeries.length > 0 ? (
              <div className="space-y-2.5">
                {patientSurgeries.map((surg) => (
                  <div
                    key={surg.id}
                    onClick={() => {
                      onClose();
                      onSelectSurgery(surg);
                    }}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{surg.tipoCirugia}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                          {surg.estado}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDateTime(surg.fechaCirugia)} • {surg.lugar}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 block">
                        {surg.finanzas.moneda === 'USD' ? '$' : profile.monedaLocalSimbolo} {surg.finanzas.gananciaNeta.toLocaleString('es-AR')}
                      </span>
                      <span className={`text-[10px] font-semibold ${
                        surg.finanzas.estadoPago === 'Cobrado' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {surg.finanzas.estadoPago}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl text-center">
                Este paciente aún no tiene cirugías registradas.
              </p>
            )}
          </div>

          {/* Pre-Op Studies Gallery */}
          {patient.fotosEstudios.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Estudios de Imagen y Laboratorios ({patient.fotosEstudios.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {patient.fotosEstudios.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => setSelectedPhoto(est.url)}
                    className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square cursor-pointer hover:shadow-md transition group"
                  >
                    <img src={est.url} alt={est.titulo} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-white p-1 truncate text-center block font-medium">
                      {est.titulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="Estudio pre-quirúrgico" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Phone, MessageSquare, Shield, Activity, ChevronRight, User } from 'lucide-react';
import { Patient, Surgery, DoctorProfile } from '../types';
import { formatDateShort } from '../lib/formatters';
import { FieldMicButton } from '../components/FieldMicButton';
import { cleanVoiceSentence } from '../lib/speechRecognition';

interface PatientsViewProps {
  patients: Patient[];
  surgeries: Surgery[];
  profile: DoctorProfile;
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  surgeries,
  profile,
  onSelectPatient,
  onNewPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    const safePatients = patients || [];
    if (!searchTerm.trim()) return safePatients;
    const q = searchTerm.toLowerCase();
    return safePatients.filter(
      p =>
        p?.nombreCompleto?.toLowerCase().includes(q) ||
        p?.dni?.includes(q) ||
        p?.obraSocial?.toLowerCase().includes(q)
    );
  }, [patients, searchTerm]);

  // Map surgical count per patient
  const surgeriesCountByPatient = useMemo(() => {
    const map: Record<string, number> = {};
    (surgeries || []).forEach(s => {
      if (s?.pacienteId) {
        map[s.pacienteId] = (map[s.pacienteId] || 0) + 1;
      }
    });
    return map;
  }, [surgeries]);

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Directorio de Pacientes
          </h1>
          <p className="text-xs text-slate-500">
            Fichas clínicas, antecedentes quirúrgicos y estudios pre-operatorios
          </p>
        </div>

        <button
          id="btn-patients-new"
          type="button"
          onClick={onNewPatient}
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 active:scale-98 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Nuevo Paciente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-patients"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por DNI, nombre o cobertura médica..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <FieldMicButton onCapture={(val) => setSearchTerm(cleanVoiceSentence(val))} title="Buscar pacientes por voz" />
          </div>
        </div>
      </div>

      {/* Patients List */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPatients.map(patient => {
            const surgCount = surgeriesCountByPatient[patient.id] || 0;
            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-200">
                        {patient.nombreCompleto.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition">
                          {patient.nombreCompleto}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          DNI: {patient.dni}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {patient.obraSocial}
                    </span>
                  </div>

                  {patient.antecedentesMedicos && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 bg-slate-50 p-2 rounded-xl">
                      {patient.antecedentesMedicos}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center gap-1 font-semibold text-teal-800">
                      <Activity className="w-3.5 h-3.5 text-teal-600" />
                      {surgCount} {surgCount === 1 ? 'cirugía' : 'cirugías'}
                    </span>
                    {patient.fotosEstudios.length > 0 && (
                      <span className="text-[11px] text-slate-400">
                        {patient.fotosEstudios.length} estudio(s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 text-slate-400 group-hover:text-teal-600 font-semibold text-[11px] transition">
                    <span>Ver Ficha</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No se encontraron pacientes
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'No hay registros que coincidan con la búsqueda.'
              : 'Agrega a tus pacientes para vincular sus cirugías, antecedentes y estudios de imagen.'}
          </p>
          <button
            type="button"
            onClick={onNewPatient}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-500 transition shadow-sm"
          >
            + Añadir Paciente
          </button>
        </div>
      )}
    </div>
  );
};

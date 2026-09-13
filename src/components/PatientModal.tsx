import React, { useState, useEffect } from 'react';
import { X, User, Phone, Shield, FileText, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { Patient, AttachedMedia } from '../types';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  initialPatient?: Patient | null;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPatient,
}) => {
  const [dni, setDni] = useState(initialPatient?.dni || '');
  const [nombreCompleto, setNombreCompleto] = useState(initialPatient?.nombreCompleto || '');
  const [telefono, setTelefono] = useState(initialPatient?.telefono || '');
  const [edad, setEdad] = useState<number | undefined>(initialPatient?.edad || undefined);
  const [obraSocial, setObraSocial] = useState(initialPatient?.obraSocial || 'OSDE');
  const [numeroAfiliado, setNumeroAfiliado] = useState(initialPatient?.numeroAfiliado || '');
  const [antecedentesMedicos, setAntecedentesMedicos] = useState(initialPatient?.antecedentesMedicos || '');
  const [alergias, setAlergias] = useState(initialPatient?.alergias || '');
  const [medicacionHabitual, setMedicacionHabitual] = useState(initialPatient?.medicacionHabitual || '');
  const [historiaClinicaResumen, setHistoriaClinicaResumen] = useState(initialPatient?.historiaClinicaResumen || '');
  const [fotosEstudios, setFotosEstudios] = useState<AttachedMedia[]>(initialPatient?.fotosEstudios || []);

  useEffect(() => {
    if (isOpen) {
      setDni(initialPatient?.dni || '');
      setNombreCompleto(initialPatient?.nombreCompleto || '');
      setTelefono(initialPatient?.telefono || '');
      setEdad(initialPatient?.edad || undefined);
      setObraSocial(initialPatient?.obraSocial || 'OSDE');
      setNumeroAfiliado(initialPatient?.numeroAfiliado || '');
      setAntecedentesMedicos(initialPatient?.antecedentesMedicos || '');
      setAlergias(initialPatient?.alergias || '');
      setMedicacionHabitual(initialPatient?.medicacionHabitual || '');
      setHistoriaClinicaResumen(initialPatient?.historiaClinicaResumen || '');
      setFotosEstudios(initialPatient?.fotosEstudios || []);
    }
  }, [isOpen, initialPatient]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newMedia: AttachedMedia = {
            id: `estudio-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            url: event.target.result as string,
            titulo: file.name.replace(/\.[^/.]+$/, ''),
            categoria: 'estudio',
            fecha: new Date().toISOString().split('T')[0],
          };
          setFotosEstudios(prev => [...prev, newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveStudio = (id: string) => {
    setFotosEstudios(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim() || !nombreCompleto.trim()) {
      alert('DNI y Nombre Completo son requeridos.');
      return;
    }

    const patientData: Patient = {
      id: initialPatient?.id || `pat-${Date.now()}`,
      dni: dni.trim(),
      nombreCompleto: nombreCompleto.trim(),
      telefono: telefono.trim(),
      edad: edad ? Number(edad) : undefined,
      obraSocial: obraSocial.trim() || 'Particular',
      numeroAfiliado: numeroAfiliado.trim() || undefined,
      antecedentesMedicos: antecedentesMedicos.trim() || undefined,
      alergias: alergias.trim() || undefined,
      medicacionHabitual: medicacionHabitual.trim() || undefined,
      historiaClinicaResumen: historiaClinicaResumen.trim() || undefined,
      fotosEstudios,
      fechaCreacion: initialPatient?.fechaCreacion || new Date().toISOString().split('T')[0],
    };

    onSave(patientData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
              {initialPatient ? 'Editar Ficha de Paciente' : 'Nuevo Paciente'}
            </h2>
            <p className="text-xs text-slate-400">
              Datos personales, antecedentes quirúrgicos y estudios preoperatorios
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DNI / Cédula <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-patient-dni"
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 38.452.190"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-patient-name"
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej: Juan Carlos Pérez"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+54 9 11 ..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Edad
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={edad || ''}
                onChange={(e) => setEdad(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Años"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Obra Social / Seguro
              </label>
              <input
                type="text"
                value={obraSocial}
                onChange={(e) => setObraSocial(e.target.value)}
                placeholder="OSDE, Swiss, Particular"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alergias Conocidas
              </label>
              <input
                type="text"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                placeholder="Ej: Penicilina, Látex, Ninguna"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medicación Habitual
              </label>
              <input
                type="text"
                value={medicacionHabitual}
                onChange={(e) => setMedicacionHabitual(e.target.value)}
                placeholder="Ej: Levotiroxina, Enalapril"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Antecedentes Médicos y Quirúrgicos
            </label>
            <textarea
              rows={2}
              value={antecedentesMedicos}
              onChange={(e) => setAntecedentesMedicos(e.target.value)}
              placeholder="Cirugías previas, patologías crónicas, factores de riesgo..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo de Consulta y Resumen Clínico
            </label>
            <textarea
              rows={3}
              value={historiaClinicaResumen}
              onChange={(e) => setHistoriaClinicaResumen(e.target.value)}
              placeholder="Cuadro clínico actual, diagnóstico presuntivo, indicación quirúrgica..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Studies / Media Uploads */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Estudios Pre-quirúrgicos y Laboratorios
              </span>
              <label className="cursor-pointer inline-flex items-center space-x-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Estudio</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {fotosEstudios.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {fotosEstudios.map(est => (
                  <div key={est.id} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                    <img src={est.url} alt={est.titulo} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveStudio(est.id)}
                      className="absolute top-1 right-1 bg-rose-600/90 text-white rounded-full p-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white p-1 truncate text-center block">
                      {est.titulo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                No hay estudios adjuntos aún.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              id="btn-save-patient"
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 active:scale-98 transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Paciente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

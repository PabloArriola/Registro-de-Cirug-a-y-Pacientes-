import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ChevronRight,
  Scissors
} from 'lucide-react';
import { Surgery, Patient, DoctorProfile, SurgeryStatus, CurrencyType } from '../types';
import { formatDateTime, formatDateShort, formatCurrency, formatTime } from '../lib/formatters';
import { FieldMicButton } from '../components/FieldMicButton';
import { cleanVoiceSentence } from '../lib/speechRecognition';

interface SurgeriesViewProps {
  surgeries: Surgery[];
  patients: Patient[];
  profile: DoctorProfile;
  isPrivate: boolean;
  onSelectSurgery: (surgery: Surgery) => void;
  onNewSurgery: () => void;
  onOpenReport: (surgery: Surgery) => void;
  onTogglePaymentStatus: (surgeryId: string) => void;
}

export const SurgeriesView: React.FC<SurgeriesViewProps> = ({
  surgeries,
  patients,
  profile,
  isPrivate,
  onSelectSurgery,
  onNewSurgery,
  onOpenReport,
  onTogglePaymentStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | SurgeryStatus>('Todas');

  const filteredSurgeries = useMemo(() => {
    return (surgeries || [])
      .filter(s => {
        if (!s) return false;
        if (statusFilter !== 'Todas' && s.estado !== statusFilter) return false;
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          s.tipoCirugia?.toLowerCase().includes(q) ||
          s.pacienteNombre?.toLowerCase().includes(q) ||
          s.pacienteDni?.includes(q) ||
          s.lugar?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.fechaCirugia).getTime() - new Date(a.fechaCirugia).getTime());
  }, [surgeries, statusFilter, searchTerm]);

  return (
    <div className="space-y-5 pb-24">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Actividad Quirúrgica
          </h1>
          <p className="text-xs text-slate-500">
            Registro de cirugías, protocolos operatorios y estados de cobro
          </p>
        </div>

        <button
          id="btn-surgeries-new"
          type="button"
          onClick={onNewSurgery}
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 active:scale-98 transition"
        >
          <Scissors className="w-4 h-4" />
          <span>+ Nueva Cirugía</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-surgeries"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por procedimiento, paciente o DNI..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <FieldMicButton onCapture={(val) => setSearchTerm(cleanVoiceSentence(val))} title="Buscar cirugías por voz" />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {(['Todas', 'Programada', 'Realizada', 'Post-Op', 'Suspendida'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'Todas' ? `Todas (${surgeries.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Surgeries List */}
      {filteredSurgeries.length > 0 ? (
        <div className="space-y-3">
          {filteredSurgeries.map((surgery) => {
            const isCollected = surgery.finanzas.estadoPago === 'Cobrado';
            return (
              <div
                key={surgery.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 p-4 sm:p-5 shadow-sm hover:shadow-md transition cursor-pointer relative group"
                onClick={() => onSelectSurgery(surgery)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          surgery.estado === 'Realizada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : surgery.estado === 'Programada'
                            ? 'bg-blue-100 text-blue-800'
                            : surgery.estado === 'Post-Op'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {surgery.estado}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {formatDateTime(surgery.fechaCirugia)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-600" />
                        {surgery.lugar}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-teal-700 transition">
                      {surgery.tipoCirugia}
                    </h3>

                    <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                      <span>👤 {surgery.pacienteNombre}</span>
                      <span className="text-slate-300">|</span>
                      <span>DNI: {surgery.pacienteDni}</span>
                      {surgery.finanzas.entidadPago && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-500">{surgery.finanzas.entidadPago}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Financial and Action badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Ganancia Neta
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-800">
                        {formatCurrency(surgery.finanzas.gananciaNeta, surgery.finanzas.moneda, profile, isPrivate)}
                      </span>
                      <div className="mt-0.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCollected
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isCollected ? 'Cobrado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Report Button */}
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onOpenReport(surgery)}
                        title="Ver Informe / WhatsApp"
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectSurgery(surgery)}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Follow-up reminder banner if Post-Op */}
                {surgery.fechaControlAlerta && surgery.estado === 'Post-Op' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-800 bg-amber-50/60 px-3 py-1.5 rounded-xl">
                    <span className="flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Control post-operatorio programado:
                    </span>
                    <span className="font-bold">
                      {formatDateShort(surgery.fechaControlAlerta)} ({surgery.diasControlAlerta} días)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
            <Scissors className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No se encontraron cirugías
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'No hay intervenciones que coincidan con los filtros aplicados.'
              : 'Empieza registrando tu primera intervención quirúrgica con dictado por voz y control financiero.'}
          </p>
          <button
            type="button"
            onClick={onNewSurgery}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-500 transition shadow-sm"
          >
            + Registrar Cirugía
          </button>
        </div>
      )}
    </div>
  );
};

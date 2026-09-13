import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Surgery, DoctorProfile, CurrencyType } from '../types';
import { formatCurrency, formatDateShort } from '../lib/formatters';

interface FinancesViewProps {
  surgeries: Surgery[];
  profile: DoctorProfile;
  isPrivate: boolean;
  onSelectSurgery: (surgery: Surgery) => void;
  onTogglePaymentStatus: (surgeryId: string) => void;
  onToggleTeamPaymentStatus: (surgeryId: string) => void;
}

type DateFilter = 'mes' | 'trimestre' | 'año' | 'todo';

export const FinancesView: React.FC<FinancesViewProps> = ({
  surgeries,
  profile,
  isPrivate,
  onSelectSurgery,
  onTogglePaymentStatus,
  onToggleTeamPaymentStatus,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('mes');
  const [activeCurrencyView, setActiveCurrencyView] = useState<'USD' | 'LOCAL' | 'AMBAS'>('AMBAS');

  // Filter surgeries by selected date period
  const filteredSurgeries = useMemo(() => {
    const now = new Date();
    const safeSurgeries = surgeries || [];
    return safeSurgeries.filter(s => {
      if (!s?.fechaCirugia) return false;
      const surgDate = new Date(s.fechaCirugia);
      if (dateFilter === 'mes') {
        return (
          surgDate.getMonth() === now.getMonth() &&
          surgDate.getFullYear() === now.getFullYear()
        );
      }
      if (dateFilter === 'trimestre') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return surgDate >= threeMonthsAgo;
      }
      if (dateFilter === 'año') {
        return surgDate.getFullYear() === now.getFullYear();
      }
      return true; // 'todo'
    });
  }, [surgeries, dateFilter]);

  // Aggregate Metrics in USD
  const metricsUSD = useMemo(() => {
    const list = filteredSurgeries.filter(s => s.finanzas.moneda === 'USD');
    const cobradas = list.filter(s => s.finanzas.estadoPago === 'Cobrado');
    const pendientes = list.filter(s => s.finanzas.estadoPago === 'Pendiente');
    const deudaEquipo = list.filter(
      s => s.finanzas.pagoEquipo > 0 && s.finanzas.estadoPagoEquipo === 'Pendiente'
    );

    const gananciaNetaCobrada = cobradas.reduce((acc, s) => acc + s.finanzas.gananciaNeta, 0);
    const montoPendiente = pendientes.reduce((acc, s) => acc + s.finanzas.montoBruto, 0);
    const montoDeudaEquipo = deudaEquipo.reduce((acc, s) => acc + s.finanzas.pagoEquipo, 0);

    return {
      gananciaNetaCobrada,
      montoPendiente,
      montoDeudaEquipo,
      countCobradas: cobradas.length,
      countPendientes: pendientes.length,
      countDeudaEquipo: deudaEquipo.length,
    };
  }, [filteredSurgeries]);

  // Aggregate Metrics in Local Currency
  const metricsLocal = useMemo(() => {
    const list = filteredSurgeries.filter(s => s.finanzas.moneda === 'LOCAL');
    const cobradas = list.filter(s => s.finanzas.estadoPago === 'Cobrado');
    const pendientes = list.filter(s => s.finanzas.estadoPago === 'Pendiente');
    const deudaEquipo = list.filter(
      s => s.finanzas.pagoEquipo > 0 && s.finanzas.estadoPagoEquipo === 'Pendiente'
    );

    const gananciaNetaCobrada = cobradas.reduce((acc, s) => acc + s.finanzas.gananciaNeta, 0);
    const montoPendiente = pendientes.reduce((acc, s) => acc + s.finanzas.montoBruto, 0);
    const montoDeudaEquipo = deudaEquipo.reduce((acc, s) => acc + s.finanzas.pagoEquipo, 0);

    return {
      gananciaNetaCobrada,
      montoPendiente,
      montoDeudaEquipo,
      countCobradas: cobradas.length,
      countPendientes: pendientes.length,
      countDeudaEquipo: deudaEquipo.length,
    };
  }, [filteredSurgeries]);

  // Outstanding collections ("En la calle")
  const pendingCollections = useMemo(() => {
    return filteredSurgeries.filter(s => s.finanzas.estadoPago === 'Pendiente');
  }, [filteredSurgeries]);

  // Outstanding payments to surgical team
  const pendingTeamPayments = useMemo(() => {
    return filteredSurgeries.filter(
      s => s.finanzas.pagoEquipo > 0 && s.finanzas.estadoPagoEquipo === 'Pendiente'
    );
  }, [filteredSurgeries]);

  // Profitability by Procedure breakdown
  const procedureBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalNetUSD: number; totalNetLocal: number }> = {};
    filteredSurgeries.forEach(s => {
      if (!map[s.tipoCirugia]) {
        map[s.tipoCirugia] = { count: 0, totalNetUSD: 0, totalNetLocal: 0 };
      }
      map[s.tipoCirugia].count += 1;
      if (s.finanzas.moneda === 'USD') {
        map[s.tipoCirugia].totalNetUSD += s.finanzas.gananciaNeta;
      } else {
        map[s.tipoCirugia].totalNetLocal += s.finanzas.gananciaNeta;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [filteredSurgeries]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Caja Quirúrgica y Finanzas</span>
          </h1>
          <p className="text-xs text-slate-500">
            Control de honorarios quirúrgicos, cuentas por cobrar y pagos a equipo médico
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm text-xs">
          {(['mes', 'trimestre', 'año', 'todo'] as const).map(period => (
            <button
              key={period}
              type="button"
              onClick={() => setDateFilter(period)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                dateFilter === period
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {period === 'mes'
                ? 'Este Mes'
                : period === 'trimestre'
                ? '3 Meses'
                : period === 'año'
                ? 'Año'
                : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {/* Currency Switcher */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="font-semibold text-slate-500">Ver moneda:</span>
        <div className="inline-flex bg-slate-200/80 p-0.5 rounded-xl">
          {(['AMBAS', 'USD', 'LOCAL'] as const).map(curr => (
            <button
              key={curr}
              type="button"
              onClick={() => setActiveCurrencyView(curr)}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                activeCurrencyView === curr
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {curr === 'AMBAS' ? 'Ambas' : curr === 'USD' ? 'Dólares (USD)' : profile.monedaLocalNombre}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Net Profit Collected */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/15 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Ganancia Neta Cobrada
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="mt-4 space-y-1">
            {(activeCurrencyView === 'AMBAS' || activeCurrencyView === 'USD') && (
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black tracking-tight">
                  {formatCurrency(metricsUSD.gananciaNetaCobrada, 'USD', profile, isPrivate)}
                </span>
                <span className="text-xs font-semibold text-emerald-200">USD</span>
              </div>
            )}
            {(activeCurrencyView === 'AMBAS' || activeCurrencyView === 'LOCAL') && (
              <div className="flex items-baseline justify-between pt-1 border-t border-white/20">
                <span className="text-xl sm:text-2xl font-black tracking-tight">
                  {formatCurrency(metricsLocal.gananciaNetaCobrada, 'LOCAL', profile, isPrivate)}
                </span>
                <span className="text-xs font-semibold text-emerald-200">Local</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-emerald-100/90 mt-3 font-medium">
            Dinero real en mano tras pagar honorarios a ayudantes.
          </p>
        </div>

        {/* KPI 2: Pending Collections ("En la Calle") */}
        <div className="p-5 rounded-3xl bg-white border border-amber-200 shadow-sm relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-600" />
              En la Calle (Por Cobrar)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {metricsUSD.countPendientes + metricsLocal.countPendientes} cirugías
            </span>
          </div>

          <div className="mt-4 space-y-1">
            {(activeCurrencyView === 'AMBAS' || activeCurrencyView === 'USD') && (
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(metricsUSD.montoPendiente, 'USD', profile, isPrivate)}
                </span>
                <span className="text-xs font-semibold text-slate-400">USD</span>
              </div>
            )}
            {(activeCurrencyView === 'AMBAS' || activeCurrencyView === 'LOCAL') && (
              <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(metricsLocal.montoPendiente, 'LOCAL', profile, isPrivate)}
                </span>
                <span className="text-xs font-semibold text-slate-400">Local</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-3">
            Obras Sociales y prepagas en auditoría o pendientes.
          </p>
        </div>

        {/* KPI 3: Team Debt ("Por Pagar a Colegas") */}
        <div className="p-5 rounded-3xl bg-white border border-rose-200 shadow-sm relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
              <Users className="w-4 h-4 text-rose-600" />
              Deuda a Equipo Médico
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
              {metricsUSD.countDeudaEquipo + metricsLocal.countDeudaEquipo} pendientes
            </span>
          </div>

          <div className="mt-4 space-y-1">
            {(activeCurrencyView === 'AMBAS' || activeCurrencyView === 'USD') && (
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
                  {formatCurrency(metricsUSD.montoDeudaEquipo, 'USD', profile, isPrivate)}
                </span>
                <span className="text-xs font-semibold text-slate-400">USD</span>
              </div>
            )}
            {(activeCurrencyView === 'AMBAS' || activeCurrencyView === 'LOCAL') && (
              <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                <span className="text-lg sm:text-xl font-black text-rose-700 tracking-tight">
                  {formatCurrency(metricsLocal.montoDeudaEquipo, 'LOCAL', profile, isPrivate)}
                </span>
                <span className="text-xs font-semibold text-slate-400">Local</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-3">
            Honorarios que debes transferir a tus ayudantes.
          </p>
        </div>
      </div>

      {/* Actionable Section 1: Cuentas Pendientes de Cobro (Ingresos) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Cirugías Pendientes de Cobro ({pendingCollections.length})
          </h2>
          <span className="text-xs text-slate-400">
            Toca "Marcar Cobrado" al recibir la liquidación
          </span>
        </div>

        {pendingCollections.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pendingCollections.map(surgery => (
              <div
                key={surgery.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition"
              >
                <div
                  className="cursor-pointer space-y-0.5"
                  onClick={() => onSelectSurgery(surgery)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 hover:text-teal-700">
                      {surgery.tipoCirugia}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      • {surgery.pacienteNombre}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDateShort(surgery.fechaCirugia)} • Cobertura: <strong className="text-slate-700">{surgery.finanzas.entidadPago}</strong>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      {formatCurrency(surgery.finanzas.montoBruto, surgery.finanzas.moneda, profile, isPrivate)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      Neto: {formatCurrency(surgery.finanzas.gananciaNeta, surgery.finanzas.moneda, profile, isPrivate)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTogglePaymentStatus(surgery.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Marcar Cobrado</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-2xl">
            ¡Excelente! No tienes cirugías pendientes de cobro en este período.
          </p>
        )}
      </div>

      {/* Actionable Section 2: Deudas a Equipo Médico (Egresos a Colegas) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Honorarios por Pagar a Ayudantes ({pendingTeamPayments.length})
          </h2>
          <span className="text-xs text-slate-400">
            Toca "Marcar Pagado" cuando le transfieras a tu colega
          </span>
        </div>

        {pendingTeamPayments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pendingTeamPayments.map(surgery => (
              <div
                key={surgery.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition"
              >
                <div
                  className="cursor-pointer space-y-0.5"
                  onClick={() => onSelectSurgery(surgery)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 hover:text-teal-700">
                      Ayudante: {surgery.equipoMedico.ayudante || 'Equipo quirúrgico'}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({surgery.tipoCirugia})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Cirugía del {formatDateShort(surgery.fechaCirugia)} • Paciente: {surgery.pacienteNombre}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-700 block">
                      {formatCurrency(surgery.finanzas.pagoEquipo, surgery.finanzas.moneda, profile, isPrivate)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      A transferir
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleTeamPaymentStatus(surgery.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Marcar Pagado</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-2xl">
            No tienes pagos pendientes a tus colegas ayudantes.
          </p>
        )}
      </div>

      {/* Analytical Section: Profitability by Procedure */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          Rendimiento por Tipo de Intervención
        </h2>

        {procedureBreakdown.length > 0 ? (
          <div className="space-y-3">
            {procedureBreakdown.map(([procedureName, stats]) => (
              <div key={procedureName} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {procedureName}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {stats.count} {stats.count === 1 ? 'operación' : 'operaciones'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                  <span>Ganancia neta generada:</span>
                  <div className="space-x-2 font-bold text-slate-900">
                    {stats.totalNetUSD > 0 && (
                      <span className="text-emerald-700">
                        {formatCurrency(stats.totalNetUSD, 'USD', profile, isPrivate)}
                      </span>
                    )}
                    {stats.totalNetLocal > 0 && (
                      <span className="text-teal-700">
                        {formatCurrency(stats.totalNetLocal, 'LOCAL', profile, isPrivate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Sin datos suficientes en este período.</p>
        )}
      </div>
    </div>
  );
};

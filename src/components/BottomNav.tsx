import React, { useState } from 'react';
import { Activity, Users, DollarSign, Settings, Plus, Scissors, UserPlus } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewSurgery: () => void;
  onOpenNewPatient: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewSurgery,
  onOpenNewPatient,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  return (
    <>
      {/* Floating Action Menu Overlay Backdrop */}
      {showQuickMenu && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setShowQuickMenu(false)}
        />
      )}

      {/* Floating Action Quick Sub-Menu */}
      {showQuickMenu && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col space-y-3 items-end animate-in fade-in zoom-in-95 duration-150">
          <button
            id="btn-quick-new-patient"
            type="button"
            onClick={() => {
              setShowQuickMenu(false);
              onOpenNewPatient();
            }}
            className="flex items-center space-x-3 bg-white text-slate-800 px-4 py-2.5 rounded-full shadow-xl border border-slate-200 font-semibold text-sm hover:bg-slate-50 transition active:scale-95"
          >
            <span>Nuevo Paciente</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </button>

          <button
            id="btn-quick-new-surgery"
            type="button"
            onClick={() => {
              setShowQuickMenu(false);
              onOpenNewSurgery();
            }}
            className="flex items-center space-x-3 bg-teal-600 text-white px-4 py-2.5 rounded-full shadow-xl font-bold text-sm hover:bg-teal-500 transition active:scale-95 shadow-teal-500/30"
          >
            <span>Nueva Cirugía</span>
            <div className="w-8 h-8 rounded-full bg-teal-800 text-teal-100 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Main Bottom Bar (Sticky at bottom for mobile, elegant docked look) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 sm:px-6 py-1.5 transition-all">
        <div className="max-w-lg sm:max-w-2xl mx-auto flex items-center justify-around relative">
          {/* Tab 1: Cirugías (Logbook) */}
          <button
            id="tab-cirugias"
            type="button"
            onClick={() => onTabChange('cirugias')}
            className={`flex flex-col items-center justify-center w-16 py-1.5 rounded-xl transition-all ${
              activeTab === 'cirugias'
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Activity className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Cirugías</span>
          </button>

          {/* Tab 2: Pacientes */}
          <button
            id="tab-pacientes"
            type="button"
            onClick={() => onTabChange('pacientes')}
            className={`flex flex-col items-center justify-center w-16 py-1.5 rounded-xl transition-all ${
              activeTab === 'pacientes'
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Pacientes</span>
          </button>

          {/* Center Floating "+" Button (One-Touch Entry) */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              id="btn-main-floating-add"
              type="button"
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className={`w-14 h-14 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/40 border-4 border-white transition-all transform active:scale-95 ${
                showQuickMenu ? 'rotate-45 bg-rose-600 shadow-rose-600/40' : 'hover:scale-105'
              }`}
              title="Añadir nueva cirugía o paciente"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-bold text-teal-800 -mt-1">Añadir</span>
          </div>

          {/* Tab 3: Finanzas */}
          <button
            id="tab-finanzas"
            type="button"
            onClick={() => onTabChange('finanzas')}
            className={`flex flex-col items-center justify-center w-16 py-1.5 rounded-xl transition-all ${
              activeTab === 'finanzas'
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <DollarSign className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Finanzas</span>
          </button>

          {/* Tab 4: Ajustes */}
          <button
            id="tab-ajustes"
            type="button"
            onClick={() => onTabChange('ajustes')}
            className={`flex flex-col items-center justify-center w-16 py-1.5 rounded-xl transition-all ${
              activeTab === 'ajustes'
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Ajustes</span>
          </button>
        </div>
      </nav>
    </>
  );
};

import React from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, Stethoscope, AlertCircle, ExternalLink } from 'lucide-react';
import { DoctorProfile, Surgery } from '../types';
import { isInIframe, openInStandaloneWindow } from '../lib/speechRecognition';

interface NavbarProps {
  profile: DoctorProfile;
  surgeries?: Surgery[];
  isPrivate: boolean;
  onTogglePrivacy: () => void;
  onLockScreen?: () => void;
  onOpenNewSurgery: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  surgeries = [],
  isPrivate,
  onTogglePrivacy,
  onLockScreen,
  onOpenNewSurgery,
}) => {
  // Calculate quick metrics for top bar safely
  const safeSurgeries = Array.isArray(surgeries) ? surgeries : [];
  const today = new Date().toISOString().split('T')[0];
  const surgeriesToday = safeSurgeries.filter(s => s?.fechaCirugia && s.fechaCirugia.startsWith(today));
  const pendingCollectionsCount = safeSurgeries.filter(s => s?.finanzas?.estadoPago === 'Pendiente').length;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand and Doctor Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <Stethoscope className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">{profile.nombre}</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Cirugía
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-none">
                {profile.especialidad}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Security Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Status Pill */}
            <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700/60 rounded-full px-3 py-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-slate-300">
                {surgeriesToday.length > 0
                  ? `${surgeriesToday.length} cirugía(s) hoy`
                  : 'Sin cirugías hoy'}
              </span>
              {pendingCollectionsCount > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {pendingCollectionsCount} cobros pendientes
                  </span>
                </>
              )}
            </div>

            {/* Privacy Mode Toggle Button */}
            <button
              id="btn-privacy-toggle"
              type="button"
              onClick={onTogglePrivacy}
              title={isPrivate ? 'Modo Privado Activo: Ocultando finanzas' : 'Activar Modo Privado (Ocultar montos)'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isPrivate
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPrivate ? 'Privado (••••)' : 'Público'}</span>
            </button>

            {/* Biometric / Security Lock Button */}
            {profile.biometriaHabilitada && (
              <button
                id="btn-lock-app"
                type="button"
                onClick={onLockScreen}
                title="Bloquear aplicación con seguridad"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Standalone / New Tab shortcut for iframe preview (ensures microphone permissions) */}
            {isInIframe() && (
              <button
                id="btn-open-new-tab"
                type="button"
                onClick={() => openInStandaloneWindow()}
                title="Abrir en pestaña nueva para habilitar micrófono, dictado y vista completa"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Abrir en Pestaña</span>
              </button>
            )}

            {/* Direct Quick Surgery Action on Desktop */}
            <button
              id="btn-header-new-surgery"
              type="button"
              onClick={onOpenNewSurgery}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-teal-500/20 transition active:scale-95"
            >
              <span>+ Nueva Cirugía</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

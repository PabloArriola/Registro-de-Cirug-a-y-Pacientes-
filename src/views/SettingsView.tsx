import React, { useState } from 'react';
import {
  User,
  Shield,
  Fingerprint,
  DollarSign,
  Download,
  Upload,
  CheckCircle2,
  LogOut,
  Building,
  Phone,
  Mail,
  Mic,
  Sparkles
} from 'lucide-react';
import { DoctorProfile } from '../types';
import { exportAppDataAsJson, importAppDataFromJson } from '../lib/storage';
import { logout } from '../lib/firebase';
import { isBiometricAvailable, registerBiometric, hasSavedBiometric } from '../lib/webauthn';
import { VoiceSettingsModal } from '../components/VoiceSettingsModal';

interface SettingsViewProps {
  profile: DoctorProfile;
  onUpdateProfile: (profile: DoctorProfile) => void;
  onDataReset?: () => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onDataReset,
  onLogout,
}) => {
  const [formData, setFormData] = useState<DoctorProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [biometricFeedback, setBiometricFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isRegisteringBio, setIsRegisteringBio] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleRegisterBiometric = async () => {
    setIsRegisteringBio(true);
    setBiometricFeedback({ type: 'info', message: 'Coloca tu dedo en el sensor o autoriza en tu dispositivo...' });
    try {
      const ok = await registerBiometric(formData.matricula || 'doctor', formData.nombre || 'Cirujano');
      if (ok) {
        setBiometricFeedback({ type: 'success', message: '¡Huella digital / FaceID vinculada con éxito en este dispositivo!' });
      }
    } catch (err: any) {
      setBiometricFeedback({ type: 'error', message: err.message || 'Error al configurar huella.' });
    } finally {
      setIsRegisteringBio(false);
    }
  };

  const handleChange = (field: keyof DoctorProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExport = () => {
    const jsonStr = exportAppDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CirugiaMed_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAppDataFromJson(content);
      if (success) {
        alert('Datos restaurados con éxito.');
        window.location.reload();
      } else {
        alert('Error: el archivo no tiene un formato válido de CirugíaMed.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Configuración y Perfil Quirúrgico
          </h1>
          <p className="text-xs text-slate-500">
            Personalización del encabezado de informes, seguridad biométrica y cuenta en la nube
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout ? onLogout : logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-teal-600" />
            Identidad Profesional
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Cirujano/a
              </label>
              <input
                id="input-profile-name"
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Especialidad Quirúrgica
              </label>
              <input
                type="text"
                value={formData.especialidad}
                onChange={(e) => handleChange('especialidad', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Matrícula Médica (MN / MP)
              </label>
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) => handleChange('matricula', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sanatorio / Quirófano Habitual
              </label>
              <input
                type="text"
                value={formData.clinicaHabitual}
                onChange={(e) => handleChange('clinicaHabitual', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={formData.telefonoContacto}
                onChange={(e) => handleChange('telefonoContacto', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Institucional
              </label>
              <input
                type="email"
                value={formData.emailContacto}
                onChange={(e) => handleChange('emailContacto', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security & Biometrics Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Fingerprint className="w-4 h-4 text-teal-600" />
            Seguridad y Acceso Biométrico
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Exigir FaceID / Huella o PIN al iniciar
                </span>
                <span className="text-[11px] text-slate-500">
                  Protege los datos clínicos confidenciales de tus pacientes
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.biometriaHabilitada}
                  onChange={(e) => handleChange('biometriaHabilitada', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN de Seguridad (4 dígitos)
              </label>
              <input
                id="input-security-pin"
                type="password"
                maxLength={4}
                value={formData.pinSeguridad}
                onChange={(e) => handleChange('pinSeguridad', e.target.value.replace(/[^0-9]/g, ''))}
                className="w-32 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 ml-2">Por defecto: 1234</span>
            </div>

            {formData.biometriaHabilitada && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={handleRegisterBiometric}
                  disabled={isRegisteringBio}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition disabled:opacity-50 active:scale-98"
                >
                  <Fingerprint className="w-4 h-4 text-teal-600" />
                  <span>{isRegisteringBio ? 'Esperando al sensor...' : 'Vincular / Probar Huella en este equipo'}</span>
                </button>
                {biometricFeedback && (
                  <p className={`text-[11px] font-medium text-center ${
                    biometricFeedback.type === 'success' ? 'text-emerald-600' :
                    biometricFeedback.type === 'error' ? 'text-rose-600' : 'text-slate-600'
                  }`}>
                    {biometricFeedback.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Voice Assistant & Natural Speech Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-teal-600" />
              Asistente de Voz y Quirófano
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Voces Humanas
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-teal-50/60 to-emerald-50/60 border border-teal-200/80 gap-3">
            <div>
              <span className="font-bold text-xs text-slate-900 block flex items-center gap-1.5">
                <span>Personalizar Voz (Menos Robótica)</span>
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Elige voces neuronales de alta definición (Siri, Google, Microsoft Natural) y ajusta la velocidad para que suene como un asistente médico humano.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-98 transition flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Configurar Voz</span>
            </button>
          </div>
        </div>

        {/* Currency & Financial Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-teal-600" />
            Configuración de Moneda Local
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de Moneda Local
              </label>
              <input
                type="text"
                value={formData.monedaLocalNombre}
                onChange={(e) => handleChange('monedaLocalNombre', e.target.value)}
                placeholder="ARS, Pesos, MXN..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Símbolo de Moneda Local
              </label>
              <input
                type="text"
                value={formData.monedaLocalSimbolo}
                onChange={(e) => handleChange('monedaLocalSimbolo', e.target.value)}
                placeholder="$, ARS$, €..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end space-x-3">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Cambios guardados
            </span>
          )}
          <button
            id="btn-save-settings"
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 active:scale-98 transition flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>

      {/* Backup & Data Recovery */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Download className="w-4 h-4 text-slate-600" />
          Respaldo y Portabilidad de Datos Quirúrgicos
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tus registros se almacenan localmente en el dispositivo. Puedes exportar una copia de seguridad en JSON o importarla en otro teléfono o computadora.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            id="btn-export-json"
            type="button"
            onClick={handleExport}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Exportar Copia (.json)</span>
          </button>

          <label className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Restaurar Copia (.json)</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Voice Configuration Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
};

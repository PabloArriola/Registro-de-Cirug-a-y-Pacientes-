import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Fingerprint,
  DollarSign,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  LogOut,
  Building,
  Phone,
  Mail,
  AlertTriangle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { DoctorProfile } from '../types';
import { exportAppDataAsJson, importAppDataFromJson, resetToMockData } from '../lib/storage';
import { logout } from '../lib/firebase';
import { checkBiometricSupport, enrollBiometric, isBiometricEnrolled, removeEnrolledBiometric } from '../lib/webauthn';
import { isInIframe, openInStandaloneWindow } from '../lib/speechRecognition';

interface SettingsViewProps {
  profile: DoctorProfile;
  onUpdateProfile: (profile: DoctorProfile) => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onDataReset,
}) => {
  const [formData, setFormData] = useState<DoctorProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [biometricSupport, setBiometricSupport] = useState<{ checked: boolean; hasSensor: boolean; reason?: string }>({
    checked: false,
    hasSensor: false,
  });
  const [enrolled, setEnrolled] = useState(false);
  const [testingBio, setTestingBio] = useState(false);
  const [bioFeedback, setBioFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    checkBiometricSupport().then(res => {
      setBiometricSupport({ checked: true, hasSensor: res.hasPlatformSensor, reason: res.reason });
    });
    setEnrolled(isBiometricEnrolled());
  }, []);

  const handleChange = (field: keyof DoctorProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestOrEnrollBiometric = async () => {
    setTestingBio(true);
    setBioFeedback(null);
    try {
      const result = await enrollBiometric(formData.emailContacto, formData.nombre);
      setTestingBio(false);
      if (result.success) {
        setEnrolled(true);
        setBioFeedback({
          type: 'success',
          message: '¡Sensor de huella / Face ID vinculado y verificado con éxito en este equipo!',
        });
        if (!formData.biometriaHabilitada) {
          handleChange('biometriaHabilitada', true);
        }
      } else {
        setBioFeedback({
          type: 'error',
          message: result.error || 'No se pudo registrar la huella.',
        });
      }
    } catch (err: any) {
      setTestingBio(false);
      setBioFeedback({
        type: 'error',
        message: err?.message || 'Error al conectar con el sensor biométrico.',
      });
    }
  };

  const handleRemoveBiometric = () => {
    removeEnrolledBiometric();
    setEnrolled(false);
    setBioFeedback({
      type: 'info',
      message: 'Vínculo biométrico restablecido en este navegador.',
    });
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

  const handleResetData = () => {
    if (confirm('¿Restablecer datos a los ejemplos de muestra iniciales?')) {
      resetToMockData();
      onDataReset();
      alert('Datos de muestra restablecidos.');
    }
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
          onClick={logout}
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
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-teal-600" />
              Seguridad y Acceso Biométrico
            </h2>
            {biometricSupport.checked && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  biometricSupport.hasSensor
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {biometricSupport.hasSensor ? '● Sensor Biométrico Compatible' : '○ Sin Sensor Físico Detectado'}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Exigir FaceID / Huella o PIN al iniciar
                </span>
                <span className="text-[11px] text-slate-500">
                  Bloquea la aplicación automáticamente para proteger los datos médicos
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

            {/* Biometric Hardware Enrollment / Test Panel */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Detector de Huella / Face ID del Dispositivo
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {enrolled
                      ? '✓ Este navegador ya tiene una credencial biométrica vinculada.'
                      : 'Vincula la huella digital registrada en tu celular o lector de PC.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {enrolled && (
                    <button
                      type="button"
                      onClick={handleRemoveBiometric}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      Desvincular
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleTestOrEnrollBiometric}
                    disabled={testingBio}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>{testingBio ? 'Esperando sensor...' : enrolled ? 'Probar / Actualizar Huella' : 'Vincular Huella'}</span>
                  </button>
                </div>
              </div>

              {bioFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 border ${
                    bioFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : bioFeedback.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {bioFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{bioFeedback.message}</span>
                </div>
              )}

              {/* Informative instructions for how biometric is set up */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800">💡 ¿Cómo funciona el sensor de huella?</p>
                <p>
                  • <strong>En Android:</strong> Usa el lector de huellas de tu teléfono (debes tener al menos una huella registrada en <em>Ajustes &gt; Seguridad / Bloqueo &gt; Huella dactilar</em>).
                </p>
                <p>
                  • <strong>En iPhone / Mac / iPad:</strong> Activa Touch ID o Face ID nativo a través de Safari o Chrome.
                </p>
                <p>
                  • <strong>En Windows:</strong> Utiliza el sensor de huella o cámara de <em>Windows Hello</em>.
                </p>
                {isInIframe() && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-amber-700 font-medium">
                    <span>⚠️ Estás en la vista previa: Los iframes de desarrollo bloquean el acceso al hardware.</span>
                    <button
                      type="button"
                      onClick={openInStandaloneWindow}
                      className="text-teal-600 hover:text-teal-700 font-bold underline flex items-center gap-1 shrink-0"
                    >
                      <span>Abrir en pestaña nueva</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN de Seguridad Alternativo (4 dígitos)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="input-security-pin"
                  type="password"
                  maxLength={4}
                  value={formData.pinSeguridad}
                  onChange={(e) => handleChange('pinSeguridad', e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-32 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">
                  Se solicitará como respaldo si el sensor de huella no está disponible. (Por defecto: 1234)
                </span>
              </div>
            </div>
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

          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar datos demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

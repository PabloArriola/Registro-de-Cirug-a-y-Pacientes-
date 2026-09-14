import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { DoctorProfile } from '../types';
import { isBiometricAvailable, verifyBiometric } from '../lib/webauthn';

interface BiometricModalProps {
  isOpen: boolean;
  profile: DoctorProfile;
  onUnlock: () => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  profile,
  onUnlock,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasBiometricSensor, setHasBiometricSensor] = useState(true);

  // Check hardware support on mount and try automatic prompt
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    isBiometricAvailable().then((available) => {
      if (!isMounted) return;
      setHasBiometricSensor(available);
      if (available) {
        // Auto trigger biometric prompt after a brief render delay
        const timer = setTimeout(() => {
          handleBiometricUnlock();
        }, 350);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleBiometricUnlock = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setErrorMsg('');

    try {
      const success = await verifyBiometric(profile.matricula || 'doctor', profile.nombre || 'Cirujano');
      if (success) {
        onUnlock();
      }
    } catch (err: any) {
      console.warn('Biometric error:', err);
      setErrorMsg(err.message || 'No se pudo verificar la huella. Puedes ingresar con PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = profile.pinSeguridad || '1234';
    if (pinInput === correctPin) {
      onUnlock();
    } else {
      setErrorMsg('PIN incorrecto. (Por defecto: 1234)');
      setPinInput('');
    }
  };

  const handleQuickDigit = (num: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      if (next.length === 4) {
        const correctPin = profile.pinSeguridad || '1234';
        if (next === correctPin) {
          setTimeout(onUnlock, 150);
        } else {
          setErrorMsg('PIN incorrecto');
          setTimeout(() => {
            setPinInput('');
            setErrorMsg('');
          }, 600);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 shadow-lg shadow-teal-500/10">
          {isVerifying ? (
            <Fingerprint className="w-10 h-10 animate-pulse text-teal-300" />
          ) : (
            <Lock className="w-8 h-8 text-teal-400" />
          )}
        </div>

        <h2 className="text-xl font-bold tracking-tight">Acceso Médico Seguro</h2>
        <p className="text-xs text-slate-400 mt-1">
          {profile.nombre} • {profile.especialidad}
        </p>

        {/* Biometric One-Touch FaceID / TouchID Unlock Button */}
        <div className="mt-6">
          <button
            id="btn-biometric-verify"
            type="button"
            onClick={handleBiometricUnlock}
            disabled={isVerifying}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 active:scale-98 transition disabled:opacity-50"
          >
            <Fingerprint className="w-5 h-5" />
            <span>{isVerifying ? 'Verificando FaceID / Huella...' : 'Desbloquear con FaceID / Huella'}</span>
          </button>
          {!hasBiometricSensor && (
            <p className="text-[11px] text-amber-400 mt-2">
              Sensor biométrico no detectado en este navegador. Utiliza tu PIN.
            </p>
          )}
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-500 font-medium">o ingresa PIN</span>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-3 my-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                pinInput.length > i ? 'bg-teal-400 scale-110 shadow-sm shadow-teal-400' : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {errorMsg && <p className="text-xs text-rose-400 font-medium mt-2">{errorMsg}</p>}

        {/* Numeric Keypad for fast iPhone feel */}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              key={digit}
              type="button"
              onClick={() => handleQuickDigit(digit)}
              className="w-16 h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-lg font-bold text-slate-200 active:bg-teal-500 active:text-slate-950 transition"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPinInput('')}
            className="w-16 h-12 rounded-xl bg-slate-800/40 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={() => handleQuickDigit('0')}
            className="w-16 h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-lg font-bold text-slate-200 active:bg-teal-500 active:text-slate-950 transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={onUnlock}
            className="w-16 h-12 rounded-xl bg-teal-500/20 text-teal-300 text-xs font-bold hover:bg-teal-500/30"
            title="Acceso directo de desarrollo"
          >
            Omitir
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-4">
          PIN de seguridad por defecto: <span className="font-mono text-slate-400 font-semibold">{profile.pinSeguridad || '1234'}</span>
        </p>
      </div>
    </div>
  );
};

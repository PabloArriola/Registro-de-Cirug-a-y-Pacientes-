import React, { useState, useEffect } from 'react';
import { Patient, Surgery, DoctorProfile, ActiveTab, SurgeryStatus } from './types';
import { initialDoctorProfile, initialPatients, initialSurgeries } from './data/mockData';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SurgeriesView } from './views/SurgeriesView';
import { PatientsView } from './views/PatientsView';
import { FinancesView } from './views/FinancesView';
import { SettingsView } from './views/SettingsView';
import { SurgeryFormModal } from './components/SurgeryFormModal';
import { SurgeryDetailModal } from './components/SurgeryDetailModal';
import { ReportModal } from './components/ReportModal';
import { PatientModal } from './components/PatientModal';
import { PatientDetailModal } from './components/PatientDetailModal';
import { BiometricModal } from './components/BiometricModal';
import { auth, loginWithGoogle, logout, getRedirectResult } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  subscribeToPatients,
  subscribeToSurgeries,
  subscribeToProfile,
  savePatientToDb,
  deletePatientFromDb,
  saveSurgeryToDb,
  deleteSurgeryFromDb,
  saveProfileToDb
} from './lib/firebaseService';
import { 
  loadPatients, 
  savePatients, 
  loadSurgeries, 
  saveSurgeries, 
  loadDoctorProfile, 
  saveDoctorProfile, 
  loadPrivacyMode, 
  savePrivacyMode 
} from './lib/storage';
import { Shield, LogIn, AlertTriangle, Laptop, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Primary App State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [profile, setProfile] = useState<DoctorProfile>(initialDoctorProfile);
  const [isPrivate, setIsPrivate] = useState<boolean>(() => loadPrivacyMode());
  const [activeTab, setActiveTab] = useState<ActiveTab>('cirugias');

  // Biometric Lock
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Surgery Modals State
  const [isSurgeryFormOpen, setIsSurgeryFormOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);
  const [selectedSurgeryDetail, setSelectedSurgeryDetail] = useState<Surgery | null>(null);

  // Clinical Report Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportingSurgery, setReportingSurgery] = useState<Surgery | null>(null);

  // Patient Modals State
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);

  // Authentication and Login State
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Authentication Listener & Redirect Handling
  useEffect(() => {
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          setUser(res.user);
          setLoginError(null);
        }
      })
      .catch((err) => {
        console.error("Redirect login error:", err);
        setLoginError(err.message || "Error al completar el acceso con Google");
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      // Don't overwrite local-doctor guest session if onAuthStateChanged fires with null
      setUser((current) => {
        if (current?.uid === 'local-doctor') return current;
        return u;
      });
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // Firebase Subscriptions
  useEffect(() => {
    if (!user) return;
    if (user.uid === 'local-doctor') {
      return;
    }
    
    const unsubPatients = subscribeToPatients(user.uid, setPatients);
    const unsubSurgeries = subscribeToSurgeries(user.uid, setSurgeries);
    const unsubProfile = subscribeToProfile(user.uid, (p) => {
      setProfile(p);
      if (p.biometriaHabilitada) setIsLocked(true);
    });
    
    return () => {
      unsubPatients();
      unsubSurgeries();
      unsubProfile();
    };
  }, [user]);

  // Sync state
  const handleTogglePrivacy = () => {
    setIsPrivate(prev => {
      const next = !prev;
      savePrivacyMode(next);
      return next;
    });
  };

  const handleUpdateProfile = (newProfile: DoctorProfile) => {
    setProfile(newProfile);
    if (user?.uid === 'local-doctor') {
      saveDoctorProfile(newProfile);
      return;
    }
    if (user) saveProfileToDb(newProfile, user.uid);
  };

  const handleDataReset = () => {
    if (user?.uid === 'local-doctor') {
      savePatients(initialPatients);
      saveSurgeries(initialSurgeries);
      saveDoctorProfile(initialDoctorProfile);
      setPatients(initialPatients);
      setSurgeries(initialSurgeries);
      setProfile(initialDoctorProfile);
      alert("Datos de muestra restablecidos localmente.");
    } else {
      alert("El reseteo de datos en la nube debe hacerse manualmente documento por documento.");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const u = await loginWithGoogle();
      if (u) {
        setUser(u);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      let msg = err.message || "Error al iniciar sesión con Google.";
      if (err.code === 'auth/operation-not-allowed') {
        msg = "El proveedor de Google aún no está activado en tu Firebase Console. Ve a Firebase Console > Authentication > Sign-in method y habilita Google.";
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = `El dominio actual (${window.location.hostname}) no está en la lista de dominios autorizados en Firebase Console (Authentication > Configuración > Dominios autorizados).`;
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = "Se cerró la ventana de inicio de sesión de Google antes de finalizar.";
      } else if (err.code === 'auth/configuration-not-found') {
        msg = "Configuración de autenticación no encontrada. Verifica Firebase Console.";
      }
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = () => {
    const localUser = {
      uid: 'local-doctor',
      email: 'local@cirugiamed.app',
      displayName: 'Dr. Local',
    } as User;
    setUser(localUser);
    const localPatients = loadPatients();
    const localSurgeries = loadSurgeries();
    const localProfile = loadDoctorProfile();
    setPatients(localPatients.length > 0 ? localPatients : initialPatients);
    setSurgeries(localSurgeries.length > 0 ? localSurgeries : initialSurgeries);
    setProfile(localProfile || initialDoctorProfile);
    if (localProfile?.biometriaHabilitada) {
      setIsLocked(true);
    }
  };

  const handleLogout = () => {
    if (user?.uid === 'local-doctor') {
      setUser(null);
    } else {
      logout();
      setUser(null);
    }
  };

  // Surgery Handlers
  const handleSaveSurgery = async (savedSurgery: Surgery) => {
    if (!user) return;
    if (user.uid === 'local-doctor') {
      setSurgeries(prev => {
        const exists = prev.some(s => s.id === savedSurgery.id);
        const next = exists ? prev.map(s => s.id === savedSurgery.id ? savedSurgery : s) : [savedSurgery, ...prev];
        saveSurgeries(next);
        return next;
      });
      if (selectedSurgeryDetail?.id === savedSurgery.id) {
        setSelectedSurgeryDetail(savedSurgery);
      }
      return;
    }
    try {
      await saveSurgeryToDb(savedSurgery, user.uid);
      if (selectedSurgeryDetail?.id === savedSurgery.id) {
        setSelectedSurgeryDetail(savedSurgery);
      }
    } catch (e: any) {
      console.error("Error saving surgery:", e);
      alert(`Error al guardar cirugía: ${e.message}`);
    }
  };

  const handleDeleteSurgery = async (surgeryId: string) => {
    if (user?.uid === 'local-doctor') {
      setSurgeries(prev => {
        const next = prev.filter(s => s.id !== surgeryId);
        saveSurgeries(next);
        return next;
      });
      if (selectedSurgeryDetail?.id === surgeryId) {
        setSelectedSurgeryDetail(null);
      }
      return;
    }
    try {
      await deleteSurgeryFromDb(surgeryId);
      if (selectedSurgeryDetail?.id === surgeryId) {
        setSelectedSurgeryDetail(null);
      }
    } catch (e: any) {
      console.error("Error deleting surgery:", e);
      alert(`Error al eliminar cirugía: ${e.message}`);
    }
  };

  const handleUpdateSurgeryStatus = async (surgeryId: string, newStatus: SurgeryStatus) => {
    const surg = surgeries.find(s => s.id === surgeryId);
    if (!surg || !user) return;
    const updated = { ...surg, estado: newStatus };
    if (user.uid === 'local-doctor') {
      setSurgeries(prev => {
        const next = prev.map(s => s.id === surgeryId ? updated : s);
        saveSurgeries(next);
        return next;
      });
      if (selectedSurgeryDetail?.id === surgeryId) {
        setSelectedSurgeryDetail(updated);
      }
      return;
    }
    try {
      await saveSurgeryToDb(updated, user.uid);
      if (selectedSurgeryDetail?.id === surgeryId) {
        setSelectedSurgeryDetail(updated);
      }
    } catch (e: any) {
      console.error("Error updating surgery:", e);
      alert(`Error al actualizar estado: ${e.message}`);
    }
  };

  const handleTogglePaymentStatus = async (surgeryId: string) => {
    const surg = surgeries.find(s => s.id === surgeryId);
    if (!surg || !user) return;
    const isNowCollected = surg.finanzas.estadoPago !== 'Cobrado';
    const updated: Surgery = {
      ...surg,
      finanzas: {
        ...surg.finanzas,
        estadoPago: isNowCollected ? 'Cobrado' : 'Pendiente',
        fechaCobroReal: isNowCollected ? new Date().toISOString().split('T')[0] : undefined,
      },
    };
    if (user.uid === 'local-doctor') {
      setSurgeries(prev => {
        const next = prev.map(s => s.id === surgeryId ? updated : s);
        saveSurgeries(next);
        return next;
      });
      if (selectedSurgeryDetail?.id === surgeryId) {
        setSelectedSurgeryDetail(updated);
      }
      return;
    }
    try {
      await saveSurgeryToDb(updated, user.uid);
      if (selectedSurgeryDetail?.id === surgeryId) {
        setSelectedSurgeryDetail(updated);
      }
    } catch (e: any) {
      console.error("Error updating payment:", e);
      alert(`Error al actualizar cobro: ${e.message}`);
    }
  };

  const handleToggleTeamPaymentStatus = async (surgeryId: string) => {
    const surg = surgeries.find(s => s.id === surgeryId);
    if (!surg || !user) return;
    const isNowPaid = surg.finanzas.estadoPagoEquipo !== 'Pagado';
    const updated: Surgery = {
      ...surg,
      finanzas: {
        ...surg.finanzas,
        estadoPagoEquipo: isNowPaid ? 'Pagado' : 'Pendiente',
        fechaPagoEquipo: isNowPaid ? new Date().toISOString().split('T')[0] : undefined,
      },
    };
    if (user.uid === 'local-doctor') {
      setSurgeries(prev => {
        const next = prev.map(s => s.id === surgeryId ? updated : s);
        saveSurgeries(next);
        return next;
      });
      if (selectedSurgeryDetail?.id === surgeryId) {
        setSelectedSurgeryDetail(updated);
      }
      return;
    }
    try {
      await saveSurgeryToDb(updated, user.uid);
      if (selectedSurgeryDetail?.id === surgeryId) {
        setSelectedSurgeryDetail(updated);
      }
    } catch (e: any) {
      console.error("Error updating team payment:", e);
      alert(`Error al actualizar pago a equipo: ${e.message}`);
    }
  };

  // Patient Handlers
  const handleSavePatient = async (savedPatient: Patient) => {
    if (!user) return;
    if (user.uid === 'local-doctor') {
      setPatients(prev => {
        const exists = prev.some(p => p.id === savedPatient.id);
        const next = exists ? prev.map(p => p.id === savedPatient.id ? savedPatient : p) : [savedPatient, ...prev];
        savePatients(next);
        return next;
      });
      if (selectedPatientDetail?.id === savedPatient.id) {
        setSelectedPatientDetail(savedPatient);
      }
      return;
    }
    try {
      await savePatientToDb(savedPatient, user.uid);
      if (selectedPatientDetail?.id === savedPatient.id) {
        setSelectedPatientDetail(savedPatient);
      }
    } catch (e: any) {
      console.error("Error saving patient:", e);
      alert(`Error al guardar paciente: ${e.message}`);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (user?.uid === 'local-doctor') {
      setPatients(prev => {
        const next = prev.filter(p => p.id !== patientId);
        savePatients(next);
        return next;
      });
      if (selectedPatientDetail?.id === patientId) {
        setSelectedPatientDetail(null);
      }
      return;
    }
    try {
      await deletePatientFromDb(patientId);
      if (selectedPatientDetail?.id === patientId) {
        setSelectedPatientDetail(null);
      }
    } catch (e: any) {
      console.error("Error deleting patient:", e);
      alert(`Error al eliminar paciente: ${e.message}`);
    }
  };

  // Modal Open Triggers
  const handleOpenNewSurgery = () => {
    setEditingSurgery(null);
    setIsSurgeryFormOpen(true);
  };

  const handleEditSurgery = (surg: Surgery) => {
    setSelectedSurgeryDetail(null);
    setEditingSurgery(surg);
    setIsSurgeryFormOpen(true);
  };

  const handleOpenReport = (surg: Surgery) => {
    setReportingSurgery(surg);
    setIsReportOpen(true);
  };

  const handleOpenNewPatient = () => {
    setEditingPatient(null);
    setIsPatientFormOpen(true);
  };

  const handleEditPatient = (pat: Patient) => {
    setSelectedPatientDetail(null);
    setEditingPatient(pat);
    setIsPatientFormOpen(true);
  };

  const handleNewSurgeryForPatient = (pat: Patient) => {
    setSelectedPatientDetail(null);
    setEditingSurgery({
      id: `surg-${Date.now()}`,
      pacienteId: pat.id,
      pacienteNombre: pat.nombreCompleto,
      pacienteDni: pat.dni,
      tipoCirugia: '',
      fechaCirugia: new Date().toISOString(),
      lugar: profile.clinicaHabitual || 'Quirófano Central',
      estado: 'Programada',
      equipoMedico: {},
      protocoloQuirurgico: '',
      fotosPostOp: [],
      diasControlAlerta: 7,
      finanzas: {
        moneda: 'USD',
        montoBruto: 1200,
        pagoEquipo: 300,
        gananciaNeta: 900,
        metodoPago: 'Obra Social',
        entidadPago: pat.obraSocial,
        estadoPago: 'Pendiente',
        estadoPagoEquipo: 'Pendiente',
      },
      creadoEl: new Date().toISOString(),
    });
    setIsSurgeryFormOpen(true);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
        <div className="bg-white max-w-md w-full rounded-3xl p-7 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">CirugíaMed</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Gestión quirúrgica, reportes clínicos y finanzas médicas.
            </p>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-left text-xs text-rose-800 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-bold block">Aviso de inicio de sesión:</span>
                <p className="leading-relaxed text-slate-700">{loginError}</p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              id="btn-login-google"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl py-3.5 font-bold text-sm transition shadow-lg disabled:opacity-60"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Conectando con Google...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-teal-400" />
                  <span>Continuar con Google</span>
                </>
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">o ingresa sin cuenta</span>
              </div>
            </div>

            <button
              id="btn-login-local"
              type="button"
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-center space-x-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl py-3 text-xs font-bold transition active:scale-98"
            >
              <Laptop className="w-4 h-4 text-teal-600" />
              <span>Ingresar en Modo Local / Demostración</span>
            </button>
            <p className="text-[11px] text-slate-400 leading-tight">
              Guarda tus pacientes y cirugías en este dispositivo sin requerir autenticación en la nube.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Professional Navigation Header */}
      <Navbar
        profile={profile}
        surgeries={surgeries}
        isPrivate={isPrivate}
        onTogglePrivacy={handleTogglePrivacy}
        onLockScreen={() => setIsLocked(true)}
        onOpenNewSurgery={handleOpenNewSurgery}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 pt-5">
        {activeTab === 'cirugias' && (
          <SurgeriesView
            surgeries={surgeries}
            patients={patients}
            profile={profile}
            isPrivate={isPrivate}
            onSelectSurgery={(surg) => setSelectedSurgeryDetail(surg)}
            onNewSurgery={handleOpenNewSurgery}
            onOpenReport={handleOpenReport}
            onTogglePaymentStatus={handleTogglePaymentStatus}
          />
        )}

        {activeTab === 'pacientes' && (
          <PatientsView
            patients={patients}
            surgeries={surgeries}
            profile={profile}
            onSelectPatient={(pat) => setSelectedPatientDetail(pat)}
            onNewPatient={handleOpenNewPatient}
          />
        )}

        {activeTab === 'finanzas' && (
          <FinancesView
            surgeries={surgeries}
            profile={profile}
            isPrivate={isPrivate}
            onSelectSurgery={(surg) => setSelectedSurgeryDetail(surg)}
            onTogglePaymentStatus={handleTogglePaymentStatus}
            onToggleTeamPaymentStatus={handleToggleTeamPaymentStatus}
          />
        )}

        {activeTab === 'ajustes' && (
          <SettingsView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onDataReset={handleDataReset}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Bottom Docked Mobile/Desktop Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewSurgery={handleOpenNewSurgery}
        onOpenNewPatient={handleOpenNewPatient}
      />

      {/* MODAL 1: Surgery Form (New or Edit) */}
      {isSurgeryFormOpen && (
        <SurgeryFormModal
          isOpen={isSurgeryFormOpen}
          onClose={() => {
            setIsSurgeryFormOpen(false);
            setEditingSurgery(null);
          }}
          onSave={handleSaveSurgery}
          patients={patients}
          profile={profile}
          initialSurgery={editingSurgery}
          onQuickAddPatient={() => {
            setIsPatientFormOpen(true);
          }}
        />
      )}

      {/* MODAL 2: Surgery Detail View */}
      {selectedSurgeryDetail && (
        <SurgeryDetailModal
          isOpen={Boolean(selectedSurgeryDetail)}
          onClose={() => setSelectedSurgeryDetail(null)}
          surgery={selectedSurgeryDetail}
          patient={patients.find(p => p.id === selectedSurgeryDetail?.pacienteId)}
          profile={profile}
          isPrivate={isPrivate}
          onEdit={handleEditSurgery}
          onDelete={handleDeleteSurgery}
          onOpenReport={handleOpenReport}
          onUpdateStatus={handleUpdateSurgeryStatus}
          onTogglePaymentStatus={handleTogglePaymentStatus}
          onToggleTeamPaymentStatus={handleToggleTeamPaymentStatus}
        />
      )}

      {/* MODAL 3: Medical Report & WhatsApp Share */}
      {isReportOpen && reportingSurgery && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false);
            setReportingSurgery(null);
          }}
          surgery={reportingSurgery}
          patient={patients.find(p => p.id === reportingSurgery?.pacienteId)}
          profile={profile}
        />
      )}

      {/* MODAL 4: Patient Form (New or Edit) */}
      {isPatientFormOpen && (
        <PatientModal
          isOpen={isPatientFormOpen}
          onClose={() => {
            setIsPatientFormOpen(false);
            setEditingPatient(null);
          }}
          onSave={handleSavePatient}
          initialPatient={editingPatient}
        />
      )}

      {/* MODAL 5: Patient Detail View & Medical Record */}
      {selectedPatientDetail && (
        <PatientDetailModal
          isOpen={Boolean(selectedPatientDetail)}
          onClose={() => setSelectedPatientDetail(null)}
          patient={selectedPatientDetail}
          patientSurgeries={(surgeries || []).filter(s => s?.pacienteId === selectedPatientDetail?.id)}
          profile={profile}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
          onSelectSurgery={(surg) => setSelectedSurgeryDetail(surg)}
          onNewSurgeryForPatient={handleNewSurgeryForPatient}
        />
      )}

      {/* MODAL 6: Biometric Security Screen */}
      {isLocked && (
        <BiometricModal
          isOpen={isLocked}
          profile={profile}
          onUnlock={() => setIsLocked(false)}
        />
      )}
    </div>
  );
}

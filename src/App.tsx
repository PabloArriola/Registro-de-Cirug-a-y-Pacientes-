import React, { useState, useEffect } from 'react';
import { Patient, Surgery, DoctorProfile, ActiveTab, SurgeryStatus } from './types';
import { initialDoctorProfile } from './data/mockData';
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
import { auth, loginWithGoogle, logout } from './lib/firebase';
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
import { loadPrivacyMode, savePrivacyMode } from './lib/storage';
import { Shield, LogIn } from 'lucide-react';

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

  // Authentication Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // Firebase Subscriptions
  useEffect(() => {
    if (!user) return;
    
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
    if (user) saveProfileToDb(newProfile, user.uid);
  };

  const handleDataReset = () => {
    // Cannot reset data trivially in cloud without deleting all docs.
    // For now, it's safer to just log out or alert.
    alert("El reseteo de datos en la nube debe hacerse manualmente documento por documento.");
  };

  // Surgery Handlers
  const handleSaveSurgery = async (savedSurgery: Surgery) => {
    if (!user) return;
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">CirugíaMed</h1>
          <p className="text-slate-500 text-sm mb-8">
            Ingresá a tu cuenta para sincronizar tus pacientes y cirugías en la nube.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 font-bold transition shadow-lg"
          >
            <LogIn className="w-5 h-5" />
            <span>Continuar con Google</span>
          </button>
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

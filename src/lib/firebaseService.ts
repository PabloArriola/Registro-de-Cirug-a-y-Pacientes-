import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, query, where, onSnapshot, getDoc } from 'firebase/firestore';
import { Patient, Surgery, DoctorProfile } from '../types';

export function subscribeToPatients(userId: string, callback: (patients: Patient[]) => void) {
  const q = query(collection(db, 'patients'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as Patient);
    callback(data);
  }, (error) => {
    console.error("Firebase error subscribing to patients:", error);
  });
}

export function subscribeToSurgeries(userId: string, callback: (surgeries: Surgery[]) => void) {
  const q = query(collection(db, 'surgeries'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as Surgery);
    // Sort by fechaCirugia descending
    data.sort((a, b) => new Date(b.fechaCirugia).getTime() - new Date(a.fechaCirugia).getTime());
    callback(data);
  }, (error) => {
    console.error("Firebase error subscribing to surgeries:", error);
  });
}

export function subscribeToProfile(userId: string, callback: (profile: DoctorProfile) => void) {
  return onSnapshot(doc(db, 'profiles', userId), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as DoctorProfile);
    }
  }, (error) => {
    console.error("Firebase error subscribing to profile:", error);
  });
}

export async function savePatientToDb(patient: Patient, userId: string) {
  const patientWithUser = JSON.parse(JSON.stringify({ ...patient, userId }));
  await setDoc(doc(db, 'patients', patient.id), patientWithUser);
}

export async function deletePatientFromDb(patientId: string) {
  await deleteDoc(doc(db, 'patients', patientId));
}

export async function saveSurgeryToDb(surgery: Surgery, userId: string) {
  const surgeryWithUser = JSON.parse(JSON.stringify({ ...surgery, userId }));
  await setDoc(doc(db, 'surgeries', surgery.id), surgeryWithUser);
}

export async function deleteSurgeryFromDb(surgeryId: string) {
  await deleteDoc(doc(db, 'surgeries', surgeryId));
}

export async function saveProfileToDb(profile: DoctorProfile, userId: string) {
  const profileWithUser = JSON.parse(JSON.stringify({ ...profile, userId }));
  await setDoc(doc(db, 'profiles', userId), profileWithUser);
}

// Daily In-Database Repository / Snapshot
export async function checkAndCreateDailySnapshot(
  userId: string,
  patients: Patient[],
  surgeries: Surgery[],
  profile: DoctorProfile
): Promise<void> {
  if (!userId || (patients.length === 0 && surgeries.length === 0)) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const snapshotId = `${userId}_${todayStr}`;
  const snapshotRef = doc(db, 'daily_snapshots', snapshotId);

  try {
    const existing = await getDoc(snapshotRef);
    if (!existing.exists()) {
      const payload = {
        id: snapshotId,
        userId,
        date: todayStr,
        createdAt: new Date().toISOString(),
        patientsCount: patients.length,
        surgeriesCount: surgeries.length,
        data: JSON.parse(JSON.stringify({ patients, surgeries, profile })),
      };
      await setDoc(snapshotRef, payload);
      console.log(`[CirugiaMed] Snapshot repositorio diario guardado en Firestore: ${snapshotId}`);
    }
  } catch (err) {
    console.warn("Could not check/create daily snapshot in Firestore:", err);
  }
}

export function subscribeToDailySnapshots(userId: string, callback: (snapshots: any[]) => void) {
  const q = query(collection(db, 'daily_snapshots'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data());
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(data);
  }, (error) => {
    console.error("Firebase error subscribing to daily_snapshots:", error);
  });
}

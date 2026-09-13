import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
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

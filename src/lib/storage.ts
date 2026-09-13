import { Patient, Surgery, DoctorProfile } from '../types';
import { initialPatients, initialSurgeries, initialDoctorProfile } from '../data/mockData';

const PATIENTS_KEY = 'cirugiamed_patients_v1';
const SURGERIES_KEY = 'cirugiamed_surgeries_v1';
const PROFILE_KEY = 'cirugiamed_profile_v1';
const PRIVACY_MODE_KEY = 'cirugiamed_privacy_mode';

export function loadPatients(): Patient[] {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    if (!raw) {
      savePatients(initialPatients);
      return initialPatients;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      savePatients(initialPatients);
      return initialPatients;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading patients from storage', e);
    return initialPatients;
  }
}

export function savePatients(patients: Patient[]): void {
  try {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  } catch (e) {
    console.error('Error saving patients to storage', e);
  }
}

export function loadSurgeries(): Surgery[] {
  try {
    const raw = localStorage.getItem(SURGERIES_KEY);
    if (!raw) {
      saveSurgeries(initialSurgeries);
      return initialSurgeries;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      saveSurgeries(initialSurgeries);
      return initialSurgeries;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading surgeries from storage', e);
    return initialSurgeries;
  }
}

export function saveSurgeries(surgeries: Surgery[]): void {
  try {
    localStorage.setItem(SURGERIES_KEY, JSON.stringify(surgeries));
  } catch (e) {
    console.error('Error saving surgeries to storage', e);
  }
}

export function loadDoctorProfile(): DoctorProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      saveDoctorProfile(initialDoctorProfile);
      return initialDoctorProfile;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      saveDoctorProfile(initialDoctorProfile);
      return initialDoctorProfile;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading doctor profile', e);
    return initialDoctorProfile;
  }
}

export function saveDoctorProfile(profile: DoctorProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving doctor profile', e);
  }
}

export function loadPrivacyMode(): boolean {
  try {
    return localStorage.getItem(PRIVACY_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function savePrivacyMode(enabled: boolean): void {
  try {
    localStorage.setItem(PRIVACY_MODE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export function exportBackupData(): string {
  const data = {
    exportDate: new Date().toISOString(),
    patients: loadPatients(),
    surgeries: loadSurgeries(),
    doctorProfile: loadDoctorProfile(),
  };
  return JSON.stringify(data, null, 2);
}

export const exportAppDataAsJson = exportBackupData;

export function restoreBackupData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed.patients)) {
      savePatients(parsed.patients);
    }
    if (Array.isArray(parsed.surgeries)) {
      saveSurgeries(parsed.surgeries);
    }
    if (parsed.doctorProfile) {
      saveDoctorProfile(parsed.doctorProfile);
    }
    return true;
  } catch (e) {
    console.error('Error parsing backup', e);
    return false;
  }
}

export const importAppDataFromJson = restoreBackupData;

export function resetToMockData(): void {
  savePatients(initialPatients);
  saveSurgeries(initialSurgeries);
  saveDoctorProfile(initialDoctorProfile);
  savePrivacyMode(false);
}

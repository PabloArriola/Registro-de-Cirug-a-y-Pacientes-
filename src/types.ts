export type CurrencyType = 'USD' | 'LOCAL';

export type SurgeryStatus = 'Programada' | 'Realizada' | 'Post-Op' | 'Suspendida';

export type PaymentMethod = 'Particular' | 'Obra Social' | 'Prepaga' | 'Seguro';

export type PaymentStatus = 'Pendiente' | 'Cobrado';

export type TeamPaymentStatus = 'Pendiente' | 'Pagado';

export interface MedicalTeam {
  ayudante?: string;
  anestesista?: string;
  instrumentadora?: string;
  otros?: string;
}

export interface AttachedMedia {
  id: string;
  url: string;
  titulo: string;
  categoria: 'estudio' | 'intraoperatorio' | 'post-op' | 'biopsia' | 'otro';
  fecha: string;
}

export interface SurgeryFinance {
  moneda: CurrencyType;
  montoBruto: number;
  pagoEquipo: number;
  gananciaNeta: number; // Monto Bruto - Pago Equipo
  metodoPago: PaymentMethod;
  entidadPago?: string; // ej: OSDE, Swiss Medical, Particular
  estadoPago: PaymentStatus;
  fechaCobroReal?: string;
  estadoPagoEquipo: TeamPaymentStatus;
  fechaPagoEquipo?: string;
  notasFinancieras?: string;
}

export interface Surgery {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteDni: string;
  tipoCirugia: string;
  fechaCirugia: string; // ISO string with date & time
  lugar: string;
  estado: SurgeryStatus;
  equipoMedico: MedicalTeam;
  protocoloQuirurgico: string;
  fotosPostOp: AttachedMedia[];
  diasControlAlerta: number; // ej: 7, 15, 30
  fechaControlAlerta?: string;
  finanzas: SurgeryFinance;
  creadoEl: string;
}

export interface Patient {
  id: string;
  dni: string;
  nombreCompleto: string;
  telefono: string;
  email?: string;
  edad?: number;
  obraSocial: string;
  numeroAfiliado?: string;
  antecedentesMedicos?: string;
  alergias?: string;
  medicacionHabitual?: string;
  historiaClinicaResumen?: string;
  fotosEstudios: AttachedMedia[];
  fechaCreacion: string;
}

export interface DoctorProfile {
  nombre: string;
  especialidad: string;
  matricula: string;
  clinicaHabitual: string;
  monedaLocalNombre: string; // e.g. "ARS (Pesos)", "EUR (€)"
  monedaLocalSimbolo: string; // e.g. "$"
  telefonoContacto: string;
  emailContacto: string;
  biometriaHabilitada: boolean;
  pinSeguridad: string;
}

export type ActiveTab = 'cirugias' | 'pacientes' | 'finanzas' | 'ajustes';

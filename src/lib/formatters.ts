import { Surgery, Patient, DoctorProfile } from '../types';

export function formatCurrency(
  amount: number,
  currency: 'USD' | 'LOCAL',
  profile: DoctorProfile,
  isPrivate: boolean = false
): string {
  if (isPrivate) {
    return '••••••';
  }

  if (currency === 'USD') {
    return `$${amount.toLocaleString('es-AR')} USD`;
  }

  return `${profile.monedaLocalSimbolo} ${amount.toLocaleString('es-AR')}`;
}

export function formatDateShort(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function formatDateTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const dateStr = d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${dateStr} • ${timeStr} hs`;
  } catch {
    return isoDate;
  }
}

export function generateWhatsAppReportText(
  surgery: Surgery,
  patient: Patient | undefined,
  profile: DoctorProfile
): string {
  const patientName = patient?.nombreCompleto || surgery.pacienteNombre;
  const dni = patient?.dni || surgery.pacienteDni;
  const dateStr = formatDateTime(surgery.fechaCirugia);

  let text = `📋 *INFORME MÉDICO POST-QUIRÚRGICO*\n`;
  text += `🩺 *${profile.nombre}* | ${profile.especialidad}\n`;
  text += `Matrícula: ${profile.matricula}\n`;
  text += `------------------------------------\n`;
  text += `👤 *Paciente:* ${patientName} (DNI: ${dni})\n`;
  text += `🏥 *Intervención:* ${surgery.tipoCirugia}\n`;
  text += `📅 *Fecha:* ${dateStr}\n`;
  text += `📍 *Centro:* ${surgery.lugar}\n\n`;

  if (surgery.equipoMedico.ayudante || surgery.equipoMedico.anestesista) {
    text += `👥 *Equipo Quirúrgico:*\n`;
    if (surgery.equipoMedico.ayudante) text += `• Ayudante: ${surgery.equipoMedico.ayudante}\n`;
    if (surgery.equipoMedico.anestesista) text += `• Anestesia: ${surgery.equipoMedico.anestesista}\n`;
    text += `\n`;
  }

  text += `📝 *Resumen del Procedimiento:*\n`;
  const summarySnippet = surgery.protocoloQuirurgico.length > 500
    ? surgery.protocoloQuirurgico.substring(0, 500) + '...'
    : surgery.protocoloQuirurgico;
  text += `${summarySnippet}\n\n`;

  text += `⚠️ *Indicaciones Post-Operatorias Inmediatas:*\n`;
  text += `1. Reposo relativo según tolerancia.\n`;
  text += `2. Mantener curaciones secas y limpias.\n`;
  text += `3. Tomar analgesia pautada al alta.\n`;
  text += `4. Control post-quirúrgico programado en ${surgery.diasControlAlerta} días.\n\n`;
  text += `📞 Ante cualquier signo de alarma (fiebre > 38°C, dolor persistente o supuración), comunicarse al: ${profile.telefonoContacto}`;

  return text;
}

export function getWhatsAppShareUrl(phone: string, text: string): string {
  // Strip special chars from phone, clean digits
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

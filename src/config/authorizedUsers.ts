// Lista oficial de correos autorizados para acceder a CirugíaMed
export const AUTHORIZED_EMAILS: readonly string[] = [
  'juanmarri2714@gmail.com',
  'arriolapablo.a@gmail.com',
];

/**
 * Valida si un correo electrónico se encuentra en la lista de usuarios autorizados.
 */
export function isEmailAuthorized(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_EMAILS.some(allowed => allowed.toLowerCase() === normalized);
}

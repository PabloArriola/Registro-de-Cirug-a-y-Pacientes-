/**
 * WebAuthn (Platform Authenticator) Service
 * Enables real fingerprint (Touch ID / Android Biometrics), Face ID,
 * and Windows Hello hardware sensor authentication in the browser.
 */

const STORAGE_CRED_ID_KEY = 'cirugiamed_biometric_cred_id';
const STORAGE_USER_ID_KEY = 'cirugiamed_biometric_user_id';

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if the browser and device have hardware biometric support (Touch ID, Fingerprint, Face ID)
 */
export async function checkBiometricSupport(): Promise<{
  supported: boolean;
  hasPlatformSensor: boolean;
  reason?: string;
}> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      supported: false,
      hasPlatformSensor: false,
      reason: 'El navegador actual no soporta el estándar WebAuthn para biometría.',
    };
  }

  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return {
        supported: true,
        hasPlatformSensor: false,
        reason: 'No se puede comprobar la presencia de sensor biométrico local.',
      };
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      supported: true,
      hasPlatformSensor: available,
      reason: available
        ? undefined
        : 'Este dispositivo no tiene un lector de huellas o Face ID activo y configurado en el sistema.',
    };
  } catch (err: any) {
    return {
      supported: false,
      hasPlatformSensor: false,
      reason: err?.message || 'Error al comprobar sensor biométrico.',
    };
  }
}

/**
 * Check if a biometric credential has already been enrolled on this device
 */
export function isBiometricEnrolled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_CRED_ID_KEY);
}

/**
 * Remove enrolled biometric from this browser
 */
export function removeEnrolledBiometric(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_CRED_ID_KEY);
  localStorage.removeItem(STORAGE_USER_ID_KEY);
}

/**
 * Register a new biometric credential with the device's native sensor
 */
export async function enrollBiometric(
  userEmail: string,
  userDisplayName: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { success: false, error: 'WebAuthn no está soportado en este navegador.' };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new Uint8Array(16);
    window.crypto.getRandomValues(userIdBytes);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'CirugíaMed',
        },
        user: {
          id: userIdBytes,
          name: userEmail || 'medico@cirugiamed.local',
          displayName: userDisplayName || 'Médico Cirujano',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256 (compatible with Touch ID, Android, FaceID)
          { alg: -257, type: 'public-key' }, // RS256 (Windows Hello)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'No se recibió respuesta del lector de huellas.' };
    }

    const credIdBase64 = bufferToBase64(credential.rawId);
    localStorage.setItem(STORAGE_CRED_ID_KEY, credIdBase64);
    localStorage.setItem(STORAGE_USER_ID_KEY, userEmail || 'medico');

    return { success: true };
  } catch (err: any) {
    console.warn('Error en registro biométrico:', err);
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'El sensor biométrico fue cancelado o no tiene permisos en esta ventana. Si estás en vista previa de desarrollo, abre la app en una pestaña nueva.',
      };
    }
    if (err.name === 'SecurityError') {
      return {
        success: false,
        error: 'El navegador bloqueó la biometría por motivos de seguridad o por ejecutarse dentro de un marco (iframe). Abre la app en una pestaña nueva.',
      };
    }
    return {
      success: false,
      error: err.message || 'Error al conectar con el sensor biométrico.',
    };
  }
}

/**
 * Verify identity using the device's native fingerprint/FaceID sensor
 */
export async function authenticateWithBiometrics(
  userEmail?: string,
  userDisplayName?: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { success: false, error: 'WebAuthn no está soportado en este navegador.' };
  }

  const storedCredId = localStorage.getItem(STORAGE_CRED_ID_KEY);

  // If this device hasn't been enrolled yet, prompt enrollment first (this will open the native fingerprint sensor!)
  if (!storedCredId) {
    return await enrollBiometric(userEmail || 'medico@cirugiamed.local', userDisplayName || 'Médico Cirujano');
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const rawIdBuffer = base64ToBuffer(storedCredId);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: rawIdBuffer,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'No se completó la verificación biométrica.' };
  } catch (err: any) {
    console.warn('Error en autenticación biométrica:', err);
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Verificación biométrica cancelada o sin permisos. Puedes intentar de nuevo o ingresar tu PIN.',
      };
    }
    if (err.name === 'SecurityError') {
      return {
        success: false,
        error: 'El navegador restringió el sensor dentro del iframe. Abre la app en una pestaña nueva o usa tu PIN.',
      };
    }
    // If the stored credential is no longer valid, re-enroll
    if (err.name === 'InvalidStateError' || err.message?.includes('not found')) {
      localStorage.removeItem(STORAGE_CRED_ID_KEY);
      return await enrollBiometric(userEmail || 'medico@cirugiamed.local', userDisplayName || 'Médico Cirujano');
    }
    return {
      success: false,
      error: err.message || 'No se pudo verificar la huella digital.',
    };
  }
}

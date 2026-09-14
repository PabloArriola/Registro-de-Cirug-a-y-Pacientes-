// WebAuthn Biometric Authentication Helper (FaceID / TouchID / Windows Hello / Android Fingerprint)

const STORAGE_KEY = 'cirugiamed_webauthn_credential_id';

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

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) {
    return false;
  }
}

export function hasSavedBiometric(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export async function registerBiometric(
  userId: string = 'doctor',
  userName: string = 'Cirujano'
): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    throw new Error('Tu navegador no soporta autenticación biométrica.');
  }

  const hostname = window.location.hostname;
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const userIdBuffer = new TextEncoder().encode(userId || 'doctor');

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'CirugíaMed',
          id: hostname,
        },
        user: {
          id: userIdBuffer,
          name: `${userId}@cirugiamed.app`,
          displayName: userName || 'Cirujano',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const credIdBase64 = bufferToBase64(credential.rawId);
      localStorage.setItem(STORAGE_KEY, credIdBase64);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Error registrando biometría:', error);
    if (error.name === 'NotAllowedError') {
      throw new Error('Registro cancelado por el usuario.');
    }
    throw new Error(error.message || 'No se pudo configurar la huella digital.');
  }
}

export async function verifyBiometric(
  userId: string = 'doctor',
  userName: string = 'Cirujano'
): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    throw new Error('Tu navegador no soporta autenticación biométrica.');
  }

  const savedCredId = localStorage.getItem(STORAGE_KEY);
  const hostname = window.location.hostname;
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));

  // If no credential is saved yet, register one first on this device
  if (!savedCredId) {
    return await registerBiometric(userId, userName);
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: hostname,
        allowCredentials: [
          {
            id: base64ToBuffer(savedCredId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return Boolean(assertion);
  } catch (error: any) {
    console.error('Error verificando biometría:', error);
    // If the saved credential is no longer valid on this device, try re-registering
    if (error.name === 'InvalidStateError' || error.name === 'NotFoundError') {
      localStorage.removeItem(STORAGE_KEY);
      return await registerBiometric(userId, userName);
    }
    if (error.name === 'NotAllowedError') {
      throw new Error('Operación cancelada. Puedes ingresar con tu PIN.');
    }
    throw new Error(error.message || 'Error en autenticación biométrica.');
  }
}

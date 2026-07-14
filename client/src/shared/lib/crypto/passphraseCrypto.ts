const PBKDF2_ITERATIONS = 600_000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12; // 96 bits standard for AES-GCM
const ENC_PREFIX = 'ENC:';

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/i, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string length.');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKeyFromPassphrase(
  passphrase: string,
  saltHex: string
): Promise<CryptoKey> {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Passphrase must not be empty.');
  }

  const saltBytes = hexToBytes(saltHex);
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  // Import raw passphrase as base key material for derivation
  const baseKey = await window.crypto.subtle.importKey('raw', passphraseBytes, 'PBKDF2', false, [
    'deriveKey',
  ]);

  // Derive non-extractable AES-GCM key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    false, // extractable = false (prevents memory inspection or JS extraction)
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypts plaintext using AES-GCM-256 with a unique random 96-bit IV.
 * Returns payload formatted as: ENC:<Base64_IV>:<Base64_CiphertextAndAuthTag>
 */
export async function encryptText(plainText: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const plainBytes = encoder.encode(plainText);

  // Generate a cryptographically secure random 96-bit IV (never reused)
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    plainBytes
  );

  const ivBase64 = bytesToBase64(iv);
  const cipherBase64 = bytesToBase64(new Uint8Array(cipherBuffer));

  return `${ENC_PREFIX}${ivBase64}:${cipherBase64}`;
}

export class DecryptionError extends Error {
  constructor(message = 'Decryption failed. Incorrect passphrase or corrupted payload.') {
    super(message);
    this.name = 'DecryptionError';
  }
}

/**
 * Decrypts an AES-GCM-256 ciphertext payload formatted as ENC:<Base64_IV>:<Base64_Ciphertext>.
 * If the content is not encrypted (does not start with ENC:), returns it directly.
 */
export async function decryptText(encryptedPayload: string, key: CryptoKey): Promise<string> {
  if (!isEncrypted(encryptedPayload)) {
    return encryptedPayload;
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3 || parts[0] !== 'ENC') {
    throw new DecryptionError('Invalid encrypted payload structure.');
  }

  try {
    const iv = base64ToBytes(parts[1]);
    const ciphertext = base64ToBytes(parts[2]);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext as BufferSource
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    throw new DecryptionError();
  }
}

/**
 * Checks whether a given string is in the ENC: format.
 */
export function isEncrypted(content: string | null | undefined): boolean {
  return typeof content === 'string' && content.startsWith(ENC_PREFIX);
}

/**
 * Encrypts a File or Blob using AES-GCM-256 with a unique random 12-byte IV.
 * Binary format stored on S3/MinIO: [12 bytes IV][AES-GCM-256 Ciphertext + 16 bytes Tag]
 */
export async function encryptFile(file: File | Blob, key: CryptoKey): Promise<Blob> {
  const fileBuffer = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    fileBuffer
  );

  return new Blob([iv, cipherBuffer], { type: 'application/octet-stream' });
}

/**
 * Decrypts an encrypted File/Blob that was encrypted with encryptFile.
 * Expects binary format: [12 bytes IV][AES-GCM-256 Ciphertext + 16 bytes Tag]
 */
export async function decryptFile(
  encryptedBlob: Blob,
  key: CryptoKey,
  targetContentType?: string
): Promise<Blob> {
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  if (arrayBuffer.byteLength <= IV_LENGTH_BYTES + 16) {
    throw new DecryptionError('Encrypted file buffer is too short.');
  }

  const iv = arrayBuffer.slice(0, IV_LENGTH_BYTES);
  const cipherBuffer = arrayBuffer.slice(IV_LENGTH_BYTES);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBuffer
    );

    return new Blob([decryptedBuffer], {
      type: targetContentType || 'application/octet-stream',
    });
  } catch {
    throw new DecryptionError('Failed to decrypt attachment.');
  }
}

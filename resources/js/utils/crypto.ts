export const CURVE_NAME = 'P-256' as const;
export const AES_KEY_LENGTH = 256; // bits
export const IV_BYTE_LENGTH = 12; // bytes — AES-GCM recommended 96-bit (12 bytes) nonce

const HKDF_SALT = new TextEncoder().encode('chat-app-v1');
const HKDF_INFO = new TextEncoder().encode('chat-app-v1-dm-conversation-key');

export interface EncryptedPayload {
    iv: string;
    ciphertext: string;
}

export const toBase64 = (
    data: ArrayBuffer | Uint8Array<ArrayBuffer>,
): string => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    let binary = ''; // btoa(String.fromCharCode(...bytes)) can crash with large data (exceeds argument limit).
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export const fromBase64 = (base64: string): Uint8Array<ArrayBuffer> =>
    Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

export const generateIdentityKeyPair = async (): Promise<CryptoKeyPair> => {
    return crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: CURVE_NAME },
        true,
        ['deriveBits'],
    );
};

export const exportPublicKey = async (key: CryptoKey): Promise<JsonWebKey> => {
    return crypto.subtle.exportKey('jwk', key);
};

export const importPublicKey = async (jwk: JsonWebKey): Promise<CryptoKey> => {
    return crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDH', namedCurve: CURVE_NAME },
        false,
        [],
    );
};

export const deriveSharedSecret = async (
    privateKey: CryptoKey,
    recipientPublicKey: CryptoKey,
): Promise<ArrayBuffer> => {
    return crypto.subtle.deriveBits(
        { name: 'ECDH', public: recipientPublicKey },
        privateKey,
        256,
    );
};

export const deriveDirectChannelKey = async (
    sharedSecret: ArrayBuffer,
): Promise<CryptoKey> => {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        'HKDF',
        false,
        ['deriveKey'],
    );

    return crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: HKDF_SALT,
            info: HKDF_INFO,
        },
        keyMaterial,
        { name: 'AES-GCM', length: AES_KEY_LENGTH },
        false,
        ['encrypt', 'decrypt'],
    );
};

export const encryptMessage = async (
    plaintext: string,
    aesKey: CryptoKey,
): Promise<EncryptedPayload> => {
    const iv = crypto.getRandomValues(
        new Uint8Array(new ArrayBuffer(IV_BYTE_LENGTH)),
    );

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        new TextEncoder().encode(plaintext),
    );

    return {
        iv: toBase64(iv),
        ciphertext: toBase64(ciphertext),
    };
};

export const decryptMessage = async (
    payload: EncryptedPayload,
    aesKey: CryptoKey,
): Promise<string> => {
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(payload.iv) },
        aesKey,
        fromBase64(payload.ciphertext),
    );

    return new TextDecoder().decode(plaintext);
};

import { create } from 'zustand';
import {
  deriveKeyFromPassphrase,
  encryptText,
  decryptText,
  decryptFile,
  isEncrypted,
} from '@/shared/lib/crypto/passphraseCrypto';

export interface SecretChatState {
  keys: Record<string, CryptoKey>;
  decryptedCache: Record<string, string>;
  decryptedAttachmentUrls: Record<string, string>;

  unlockChannel: (channelId: string, passphrase: string, salt: string) => Promise<boolean>;
  lockChannel: (channelId: string) => void;
  isUnlocked: (channelId: string) => boolean;

  encryptMessageContent: (content: string, channelId: string) => Promise<string>;
  decryptMessageContent: (messageId: string, content: string, channelId: string) => Promise<string>;
  decryptAttachmentBlob: (
    attachmentId: string,
    channelId: string,
    remoteUrl: string,
    contentType: string
  ) => Promise<string>;
}

const pendingAttachmentDecrypts: Record<string, Promise<string> | undefined> = {};

export const useSecretChatStore = create<SecretChatState>((set, get) => ({
  keys: {},
  decryptedCache: {},
  decryptedAttachmentUrls: {},

  unlockChannel: async (channelId: string, passphrase: string, salt: string) => {
    try {
      const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
      set((state) => ({
        keys: { ...state.keys, [channelId]: derivedKey },
      }));
      return true;
    } catch {
      return false;
    }
  },

  lockChannel: (channelId: string) => {
    Object.keys(pendingAttachmentDecrypts).forEach((k) => delete pendingAttachmentDecrypts[k]);

    const urls = get().decryptedAttachmentUrls;
    Object.values(urls).forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {
        console.warn(`Failed to revoke object URL: ${u}`);
      }
    });

    set((state) => {
      const newKeys = { ...state.keys };
      delete newKeys[channelId];
      return { keys: newKeys, decryptedCache: {}, decryptedAttachmentUrls: {} };
    });
  },

  isUnlocked: (channelId: string) => {
    return Boolean(get().keys[channelId]);
  },

  encryptMessageContent: async (content: string, channelId: string) => {
    const key = get().keys[channelId];
    if (!key) throw new Error('Channel is locked');
    return encryptText(content, key);
  },

  decryptMessageContent: async (messageId: string, content: string, channelId: string) => {
    if (!isEncrypted(content)) return content;

    const cached = get().decryptedCache[messageId];
    if (cached !== undefined) return cached;

    const key = get().keys[channelId];
    if (!key) return content;

    try {
      const plainText = await decryptText(content, key);
      set((state) => ({
        decryptedCache: { ...state.decryptedCache, [messageId]: plainText },
      }));
      return plainText;
    } catch {
      return '[Decryption failed: Incorrect passphrase]';
    }
  },

  decryptAttachmentBlob: async (
    attachmentId: string,
    channelId: string,
    remoteUrl: string,
    contentType: string
  ) => {
    const cached = get().decryptedAttachmentUrls[attachmentId];
    if (cached) return cached;

    const inFlight = pendingAttachmentDecrypts[attachmentId];
    if (inFlight) {
      return inFlight;
    }

    const key = get().keys[channelId];
    if (!key) throw new Error('Channel is locked');

    const decryptPromise = (async () => {
      try {
        const res = await fetch(remoteUrl);
        if (!res.ok) throw new Error(`Failed to fetch attachment (${res.status})`);
        const blob = await res.blob();

        const decryptedBlob = await decryptFile(blob, key, contentType);
        const objectUrl = URL.createObjectURL(decryptedBlob);

        set((state) => ({
          decryptedAttachmentUrls: { ...state.decryptedAttachmentUrls, [attachmentId]: objectUrl },
        }));

        return objectUrl;
      } finally {
        delete pendingAttachmentDecrypts[attachmentId];
      }
    })();

    pendingAttachmentDecrypts[attachmentId] = decryptPromise;
    return decryptPromise;
  },
}));

import { ChatMessage, PageProps } from '@/types';
import {
    decryptMessage as cryptoDecryptMessage,
    encryptMessage as cryptoEncryptMessage,
    deriveDirectChannelKey,
    deriveSharedSecret,
    exportPublicKey,
    generateIdentityKeyPair,
    importPublicKey,
    type EncryptedPayload,
} from '@/utils/crypto';
import {
    clearPrivateKey,
    loadPrivateKey,
    savePrivateKey,
} from '@/utils/key-storage';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    PropsWithChildren,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

type E2EEContextValue = {
    isE2EEReady: boolean;

    encryptForUser: (
        recipientUserId: number,
        plaintext: string,
    ) => Promise<EncryptedPayload | null>;

    decryptForPeer: (
        message: ChatMessage,
        peerUserId: number,
    ) => Promise<string | null>;
};

const E2EEContext = createContext<E2EEContextValue | undefined>(undefined);

export const E2EEProvider = ({ children }: PropsWithChildren) => {
    const { auth } = usePage<PageProps>().props;
    const userId = +auth.user.id;

    const [isE2EEReady, setIsE2EEReady] = useState(false);

    const privateKeyRef = useRef<CryptoKey | null>(null);

    const channelKeyCache = useRef<Map<number, CryptoKey>>(new Map());
    const publicKeyCache = useRef<Map<number, CryptoKey>>(new Map());
    const publicKeyRequestCache = useRef<
        Map<number, Promise<CryptoKey | null>>
    >(new Map());

    const isMountedRef = useRef(true);
    const serverHasPublicKeyRef = useRef(!!auth.user.public_key);

    const generateAndUploadKeyPair = useCallback(async () => {
        const keyPair = await generateIdentityKeyPair();

        await savePrivateKey(userId, keyPair.privateKey);

        try {
            const publicJwk = await exportPublicKey(keyPair.publicKey);

            await axios.put(route('users.key.update'), {
                public_key: publicJwk,
            });

            serverHasPublicKeyRef.current = true;
        } catch {
            console.warn('Public key upload failed.');
        }

        return keyPair.privateKey;
    }, [userId]);

    const initE2EE = useCallback(async (): Promise<void> => {
        try {
            let privateKey = await loadPrivateKey(userId);

            if (!privateKey) {
                privateKey = await generateAndUploadKeyPair();
            }

            if (privateKey && !serverHasPublicKeyRef.current) {
                privateKey = await generateAndUploadKeyPair();
            }

            if (!isMountedRef.current) return;

            privateKeyRef.current = privateKey;
            setIsE2EEReady(true);
        } catch (error) {
            console.error('[E2EE] Init failed:', error);
        }
    }, [userId, generateAndUploadKeyPair]);

    useEffect(() => {
        isMountedRef.current = true;
        void initE2EE();
        return () => {
            isMountedRef.current = false;
        };
    }, [initE2EE]);

    useEffect(() => {
        const removeListener = router.on('before', (event) => {
            if (event.detail.visit.url.pathname.endsWith('/logout')) {
                void clearPrivateKey(userId);
            }
        });
        return removeListener;
    }, [userId]);

    const getOrFetchPublicKey = useCallback(
        async (userId: number): Promise<CryptoKey | null> => {
            if (publicKeyCache.current.has(userId)) {
                return publicKeyCache.current.get(userId)!;
            }

            const inflightRequest = publicKeyRequestCache.current.get(userId);
            if (inflightRequest) {
                return inflightRequest;
            }

            const request = (async (): Promise<CryptoKey | null> => {
                try {
                    const { data } = await axios.get<{
                        public_key: JsonWebKey | null;
                    }>(route('users.public-key', userId));

                    if (!data.public_key) return null;

                    const key = await importPublicKey(data.public_key);
                    publicKeyCache.current.set(userId, key);
                    return key;
                } catch {
                    return null;
                } finally {
                    publicKeyRequestCache.current.delete(userId);
                }
            })();

            publicKeyRequestCache.current.set(userId, request);
            return request;
        },
        [],
    );

    const getOrDeriveDirectChannelKey = useCallback(
        async (peerUserId: number): Promise<CryptoKey | null> => {
            if (!privateKeyRef.current) return null;

            if (channelKeyCache.current.has(peerUserId)) {
                return channelKeyCache.current.get(peerUserId)!;
            }

            const peerPublicKey = await getOrFetchPublicKey(peerUserId);
            if (!peerPublicKey) return null;

            const sharedSecret = await deriveSharedSecret(
                privateKeyRef.current,
                peerPublicKey,
            );
            const conversationKey = await deriveDirectChannelKey(sharedSecret);

            channelKeyCache.current.set(peerUserId, conversationKey);
            return conversationKey;
        },
        [getOrFetchPublicKey],
    );

    const encryptForUser = useCallback(
        async (
            recipientUserId: number,
            plaintext: string,
        ): Promise<EncryptedPayload | null> => {
            if (!isE2EEReady) return null;

            const key = await getOrDeriveDirectChannelKey(recipientUserId);
            if (!key) return null;

            try {
                return await cryptoEncryptMessage(plaintext, key);
            } catch {
                return null;
            }
        },
        [isE2EEReady, getOrDeriveDirectChannelKey],
    );

    const decryptForPeer = useCallback(
        async (
            message: ChatMessage,
            peerUserId: number,
        ): Promise<string | null> => {
            if (!message.is_encrypted || !message.iv || !message.ciphertext) {
                return null;
            }

            const key = await getOrDeriveDirectChannelKey(peerUserId);
            if (!key) return null;

            try {
                return await cryptoDecryptMessage(
                    { iv: message.iv, ciphertext: message.ciphertext },
                    key,
                );
            } catch {
                return null;
            }
        },
        [getOrDeriveDirectChannelKey],
    );

    return (
        <E2EEContext.Provider
            value={{ isE2EEReady, encryptForUser, decryptForPeer }}
        >
            {children}
        </E2EEContext.Provider>
    );
};

export const useE2EE = (): E2EEContextValue => {
    const context = useContext(E2EEContext);
    if (!context) {
        throw new Error('useE2EE must be used within E2EEProvider');
    }
    return context;
};

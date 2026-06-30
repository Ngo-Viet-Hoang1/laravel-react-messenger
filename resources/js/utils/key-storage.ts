import { del, get, set } from 'idb-keyval';

const getPrivateKeyName = (userId: number) =>
    `e2ee:identity:private_key:${userId}`;

export const savePrivateKey = async (userId: number, key: CryptoKey) => {
    await set(getPrivateKeyName(userId), key);
};

export async function loadPrivateKey(
    userId: number,
): Promise<CryptoKey | null> {
    return (await get<CryptoKey>(getPrivateKeyName(userId))) ?? null;
}

export async function clearPrivateKey(userId: number): Promise<void> {
    await del(getPrivateKeyName(userId));
}

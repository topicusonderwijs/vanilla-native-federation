import { type StorageEntryCreator, nfNamespace, type NfCache, type StorageEntry } from "./../../lib/handlers/storage/storage.contract";

const localStorageEntry: StorageEntryCreator = <TCache extends NfCache, K extends keyof TCache>(key: K, initialValue: TCache[K]) => {

    const entry: StorageEntry<TCache[K]> = {
        get(): TCache[K] {
            const fromCache = localStorage.getItem(`${nfNamespace}.${String(key)}`);
            if (!fromCache) { 
                entry.set(initialValue);
                return initialValue;
            }
            return JSON.parse(fromCache);
        },
        set(value: TCache[K]): StorageEntry<TCache[K]> {
            localStorage.setItem(`${nfNamespace}.${String(key)}`, JSON.stringify(value));
            return entry;
        },
    };

    return entry;
}

export {localStorageEntry};
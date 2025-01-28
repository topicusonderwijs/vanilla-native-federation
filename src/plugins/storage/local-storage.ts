import { type StorageEntryCreator, nfNamespace, type NfCache, type StorageEntry } from "./../../lib/handlers/storage/storage.contract";

const localStorageEntry: StorageEntryCreator = <TCache extends NfCache, K extends keyof TCache>(key: K, initialValue: TCache[K]) => {

    const entry: StorageEntry<TCache[K]> = {
        get(): TCache[K] {
            const asString = localStorage.getItem(`${nfNamespace}.${String(key)}`) ?? JSON.stringify(initialValue)
            return JSON.parse(asString);
        },
        set(value: TCache[K]): StorageEntry<TCache[K]> {
            const asString = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(`${nfNamespace}.${String(key)}`, asString)
            return entry;
        },
    };

    return entry;
}

export {localStorageEntry};
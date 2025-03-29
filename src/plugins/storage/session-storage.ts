import { type StorageEntryCreator, type NfCache, type StorageEntry } from "./../../lib/core/storage/storage.contract";
import { NF_STORAGE_ENTRY } from '../../lib/config/namespace.contract';

const sessionStorageEntry: StorageEntryCreator = <TCache extends NfCache, K extends keyof TCache>(key: K, initialValue: TCache[K]) => {

    const entry: StorageEntry<TCache[K]> = {
        get(): TCache[K] {
            const fromCache = sessionStorage.getItem(`${NF_STORAGE_ENTRY}.${String(key)}`);
            if (!fromCache) { 
                entry.set(initialValue);
                return initialValue;
            }
            return JSON.parse(fromCache);
        },
        set(value: TCache[K]): StorageEntry<TCache[K]> {
            sessionStorage.setItem(`${NF_STORAGE_ENTRY}.${String(key)}`, JSON.stringify(value));
            return entry;
        },
    };

    return entry;
}

export {sessionStorageEntry};

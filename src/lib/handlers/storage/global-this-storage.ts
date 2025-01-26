import { type StorageEntryCreator, nfNamespace, type StorageEntry, type NfCache, type StorageOf } from "./storage.contract";
import { toStorage } from "./to-storage";

type GlobalThisStorage = {[nfNamespace]: Record<string, unknown>;};

const globalThisStorageEntry: StorageEntryCreator = <T>(key: string, _fallback: T) => {
    if (!(globalThis as unknown as GlobalThisStorage)[nfNamespace]) {
        (globalThis as unknown as GlobalThisStorage)[nfNamespace] = {};
    }
    const namespace = (globalThis as unknown as GlobalThisStorage)[nfNamespace];
    
    const entry = {
        get(): T {
            return (namespace[key] as T) ?? _fallback;
        },
        set(value: T): StorageEntry<T> {
            namespace[key] = value;
            return entry;
        },
        exists(): boolean {
            return key in namespace;
        }
    };

    return entry;
}

const createGlobalThisStorageCache = <TCache extends NfCache>(cache: TCache): StorageOf<TCache> => {
    return toStorage(cache, globalThisStorageEntry)
}

export {GlobalThisStorage, globalThisStorageEntry, createGlobalThisStorageCache};
import { toStorage } from "../../lib/handlers/storage/storage.handler";
import { type StorageEntryCreator, type StorageOf, nfNamespace, type NfCache, type StorageEntry } from "./../../lib/handlers/storage/storage.contract";

const localStorageEntry: StorageEntryCreator = <T>(key: string, _fallback: T) => {
    const entry = {
        get(): T {
            const asString = localStorage.getItem(`${nfNamespace}.${key}`) ?? JSON.stringify(_fallback)
            return JSON.parse(asString);
        },
        
        set(value: T): StorageEntry<T> {
            const asString = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(`${nfNamespace}.${key}`, asString)
            return entry;
        },
        
        exists(): boolean {
            return !!localStorage.getItem(`${nfNamespace}.${key}`);
        }
    };

    return entry;
}

const createLocalStorageCache = <TCache extends NfCache>(cache: TCache): StorageOf<TCache> => {
    return toStorage(cache, localStorageEntry)
}

export {createLocalStorageCache, localStorageEntry};
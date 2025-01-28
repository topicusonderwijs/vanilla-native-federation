import { cloneEntry } from "./clone-entry";
import { type StorageEntryCreator, nfNamespace, type StorageEntry, type NfCache } from "./storage.contract";

const globalThisStorageEntry: StorageEntryCreator = <TCache extends NfCache, K extends keyof TCache = keyof TCache>
    (key: K, initialValue: TCache[K]) => {
        if (!(globalThis as unknown as {[nfNamespace]: unknown})[nfNamespace]) {
            (globalThis as unknown as {[nfNamespace]: unknown})[nfNamespace] = {};
        }
        
        const namespace = (globalThis as unknown as {[nfNamespace]: Pick<TCache, K>})[nfNamespace];
        if(!namespace[key]) namespace[key] = initialValue;
        
        const entry: StorageEntry<TCache[K]> = {
            get(): TCache[K] {
                return cloneEntry(key, namespace[key])!;
            },
            set(value: TCache[K]): StorageEntry<TCache[K]> {
                namespace[key] = cloneEntry(key, value);
                return entry;
            }
        };

        return entry;
    }

export {globalThisStorageEntry};
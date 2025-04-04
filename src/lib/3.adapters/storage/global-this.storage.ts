import type { NfCache } from "lib/1.domain";
import { cloneEntry } from "./clone-entry";
import { type StorageEntryCreator, type StorageEntry, NF_STORAGE_ENTRY } from "./storage.contract";

const globalThisStorageEntry: StorageEntryCreator = <TCache extends NfCache, K extends keyof TCache = keyof TCache>
    (key: K, initialValue: TCache[K]) => {
        if (!(globalThis as unknown as {[NF_STORAGE_ENTRY]: unknown})[NF_STORAGE_ENTRY]) {
            (globalThis as unknown as {[NF_STORAGE_ENTRY]: unknown})[NF_STORAGE_ENTRY] = {};
        }
        
        const namespace = (globalThis as unknown as {[NF_STORAGE_ENTRY]: Pick<TCache, K>})[NF_STORAGE_ENTRY];
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
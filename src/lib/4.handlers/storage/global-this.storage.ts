import { cloneEntry } from "./clone-entry";
import { type StorageEntryHandler, type StorageEntry, NF_STORAGE_ENTRY } from "../../2.app/handlers/storage.contract";

const globalThisStorageEntry: StorageEntryHandler = <TValue>
    (key: string, initialValue: TValue) => {
        if (!(globalThis as unknown as {[NF_STORAGE_ENTRY]: unknown})[NF_STORAGE_ENTRY]) {
            (globalThis as unknown as {[NF_STORAGE_ENTRY]: unknown})[NF_STORAGE_ENTRY] = {};
        }
        
        const namespace = (globalThis as unknown as {[NF_STORAGE_ENTRY]: {[P in typeof key]: TValue}})[NF_STORAGE_ENTRY];
        if(!namespace[key]) namespace[key] = initialValue;
        
        const entry: StorageEntry<TValue> = {
            get(): TValue {
                return cloneEntry(key, namespace[key])!;
            },
            set(value: TValue): StorageEntry<TValue> {
                namespace[key] = cloneEntry(key, value);
                return entry;
            }
        };

        return entry;
    }

export {globalThisStorageEntry};
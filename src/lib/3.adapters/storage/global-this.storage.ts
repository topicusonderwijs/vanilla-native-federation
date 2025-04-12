import { cloneEntry } from "./clone-entry";
import { type StorageEntryCreator, type StorageEntry, NF_STORAGE_ENTRY } from "./storage.contract";

const globalThisStorageEntry: StorageEntryCreator = <TValue>
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
            },
            mutate(updateFn: (val: TValue) => TValue): void {
                const newVal = updateFn(namespace[key]!);
                namespace[key] = cloneEntry(key, newVal);
            }
        };

        return entry;
    }

export {globalThisStorageEntry};
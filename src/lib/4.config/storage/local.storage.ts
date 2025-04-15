import { type StorageEntryHandler, type StorageEntry, NF_STORAGE_ENTRY } from "../../2.app/config/storage.contract";

const localStorageEntry: StorageEntryHandler = <TValue>

    (key: string, initialValue: TValue) => {
        const entry: StorageEntry<TValue> = {
            get(): TValue {
                const fromCache = localStorage.getItem(`${NF_STORAGE_ENTRY}.${String(key)}`);
                if (!fromCache) { 
                    entry.set(initialValue);
                    return initialValue;
                }
                return JSON.parse(fromCache);
            },
            set(value: TValue): StorageEntry<TValue> {
                localStorage.setItem(`${NF_STORAGE_ENTRY}.${String(key)}`, JSON.stringify(value));
                return entry;
            }
        };
        return entry;
    }

export {localStorageEntry};
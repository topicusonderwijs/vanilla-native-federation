import { type StorageEntryHandler, type StorageEntry, NF_STORAGE_ENTRY } from "lib/2.app/config/storage.contract";

const localStorageEntry: StorageEntryHandler = <TValue>

    (key: string, initialValue: TValue) => {
        if (!localStorage.getItem(`${NF_STORAGE_ENTRY}.${String(key)}`)) { 
            localStorage.setItem(`${NF_STORAGE_ENTRY}.${String(key)}`, JSON.stringify(initialValue));
        }
        const entry: StorageEntry<TValue> = {
            get() {
                const fromCache = localStorage.getItem(`${NF_STORAGE_ENTRY}.${String(key)}`);
                if (!fromCache) return undefined;
                return JSON.parse(fromCache);
            },
            set(value: TValue): StorageEntry<TValue> {
                localStorage.setItem(`${NF_STORAGE_ENTRY}.${String(key)}`, JSON.stringify(value));
                return entry;
            },
            clear(): StorageEntry<TValue> {
                localStorage.setItem(`${NF_STORAGE_ENTRY}.${String(key)}`, JSON.stringify(initialValue));
                return this;
            }
        };
        return entry;
    }

export {localStorageEntry};
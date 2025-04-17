import { type StorageEntryHandler, type StorageEntry, NF_STORAGE_ENTRY } from "../../2.app/config/storage.contract";

const sessionStorageEntry: StorageEntryHandler = <TValue>
    (key: string, initialValue: TValue) => {
        if (!sessionStorage.getItem(`${NF_STORAGE_ENTRY}.${String(key)}`)) { 
            sessionStorage.setItem(`${NF_STORAGE_ENTRY}.${String(key)}`, JSON.stringify(initialValue));
        }
        const entry: StorageEntry<TValue> = {
            get() {
                const fromCache = sessionStorage.getItem(`${NF_STORAGE_ENTRY}.${String(key)}`);
                if (!fromCache) return undefined;
                return JSON.parse(fromCache);
            },
            set(value: TValue): StorageEntry<TValue> {
                sessionStorage.setItem(`${NF_STORAGE_ENTRY}.${String(key)}`, JSON.stringify(value));
                return entry;
            },
            clear(): StorageEntry<TValue> {
                sessionStorage.setItem(`${NF_STORAGE_ENTRY}.${String(key)}`, JSON.stringify(initialValue));
                return this;
            }
        };
        return entry;
    }

export {sessionStorageEntry};
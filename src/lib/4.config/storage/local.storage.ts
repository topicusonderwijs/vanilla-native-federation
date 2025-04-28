import type { StorageEntryCreator, StorageEntry } from "lib/2.app/config/storage.contract";

const localStorageEntry: StorageEntryCreator = 
    (namespace: string) => <TValue>(key: string, initialValue: TValue) => {
        if (!localStorage.getItem(`${namespace}.${String(key)}`)) { 
            localStorage.setItem(`${namespace}.${String(key)}`, JSON.stringify(initialValue));
        }
        const entry: StorageEntry<TValue> = {
            get() {
                const fromCache = localStorage.getItem(`${namespace}.${String(key)}`);
                if (!fromCache) return undefined;
                return JSON.parse(fromCache);
            },
            set(value: TValue): StorageEntry<TValue> {
                localStorage.setItem(`${namespace}.${String(key)}`, JSON.stringify(value));
                return entry;
            },
            clear(): StorageEntry<TValue> {
                localStorage.setItem(`${namespace}.${String(key)}`, JSON.stringify(initialValue));
                return this;
            }
        };
        return entry;
    }

export {localStorageEntry};
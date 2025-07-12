import type { StorageEntryCreator, StorageEntry } from 'lib/2.app/config/storage.contract';

const sessionStorageEntry: StorageEntryCreator =
  (namespace: string) =>
  <TValue>(key: string, initialValue: TValue) => {
    if (!sessionStorage.getItem(`${namespace}.${String(key)}`)) {
      sessionStorage.setItem(`${namespace}.${String(key)}`, JSON.stringify(initialValue));
    }
    const entry: StorageEntry<TValue> = {
      get() {
        const fromCache = sessionStorage.getItem(`${namespace}.${String(key)}`);
        if (!fromCache) return undefined;
        return JSON.parse(fromCache);
      },
      set(value: TValue): StorageEntry<TValue> {
        sessionStorage.setItem(`${namespace}.${String(key)}`, JSON.stringify(value));
        return entry;
      },
      clear(): StorageEntry<TValue> {
        sessionStorage.setItem(`${namespace}.${String(key)}`, JSON.stringify(initialValue));
        return this;
      },
    };
    return entry;
  };

export { sessionStorageEntry };

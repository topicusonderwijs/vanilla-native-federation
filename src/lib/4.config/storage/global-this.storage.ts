import { cloneEntry } from '../../utils/clone-entry';
import { type StorageEntryCreator, type StorageEntry } from 'lib/2.app/config/storage.contract';

const globalThisStorageEntry: StorageEntryCreator =
  (namespace: string) =>
  <TValue>(key: string, initialValue: TValue) => {
    if (!(globalThis as unknown as { [namespace]: unknown })[namespace]) {
      (globalThis as unknown as { [namespace]: unknown })[namespace] = {};
    }

    const storage = (globalThis as unknown as { [namespace]: { [P in typeof key]: TValue } })[
      namespace
    ]!;
    if (!storage[key]) storage[key] = initialValue;

    const entry: StorageEntry<TValue> = {
      get(): TValue {
        return cloneEntry(key, storage[key])!;
      },
      set(value: TValue): StorageEntry<TValue> {
        storage[key] = cloneEntry(key, value);
        return entry;
      },
      clear(): StorageEntry<TValue> {
        storage[key] = cloneEntry(key, initialValue);
        return this;
      },
    };

    return entry;
  };

export { globalThisStorageEntry };

import type { NfCache } from 'lib/1.domain';

type StorageEntry<TValue> = {
    set: (value: TValue) => StorageEntry<TValue>;
    get: () => TValue;
};

type StorageEntryKey = number|symbol|string;

type StorageEntryCreator = <TCache extends NfCache, K extends keyof TCache = keyof TCache>(key: K, initialValue: TCache[K]) => StorageEntry<TCache[K]>;

type StorageConfig = {
    toStorageEntry: StorageEntryCreator,
}

const NF_STORAGE_ENTRY = "__NATIVE_FEDERATION__";

export {StorageEntry, StorageEntryKey, StorageEntryCreator, NF_STORAGE_ENTRY, StorageConfig}
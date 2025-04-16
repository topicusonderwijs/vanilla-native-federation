const NF_STORAGE_ENTRY = "__NATIVE_FEDERATION__";

type StorageEntry<TValue> = {
    set: (value: TValue) => StorageEntry<TValue>;
    get: () => TValue;
};

type StorageEntryKey = number|symbol|string;

type StorageEntryHandler = <TValue>(key: string, initialValue: TValue) => StorageEntry<TValue>;

type StorageConfig = {
    storage: StorageEntryHandler,
}

type StorageOptions = Partial<StorageConfig>

export {StorageEntry, StorageEntryKey, StorageEntryHandler, NF_STORAGE_ENTRY, StorageConfig, StorageOptions}
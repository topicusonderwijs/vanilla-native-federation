type StorageEntry<TValue> = {
    set: (value: TValue) => StorageEntry<TValue>;
    get: () => TValue;
    mutate: (mutateFn: (val: TValue) => TValue) => void;
};

type StorageEntryKey = number|symbol|string;

type StorageEntryCreator = <TValue>(key: string, initialValue: TValue) => StorageEntry<TValue>;

type StorageConfig = {
    toStorageEntry: StorageEntryCreator,
}

const NF_STORAGE_ENTRY = "__NATIVE_FEDERATION__";

export {StorageEntry, StorageEntryKey, StorageEntryCreator, NF_STORAGE_ENTRY, StorageConfig}
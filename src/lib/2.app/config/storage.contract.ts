type StorageEntry<TValue> = {
  set: (value: TValue) => StorageEntry<TValue>;
  get: () => TValue | undefined;
  clear: () => StorageEntry<TValue>;
};

type StorageEntryKey = number | symbol | string;

type StorageEntryCreator = (namespace: string) => StorageEntryHandler;

type StorageEntryHandler = <TValue>(key: string, initialValue: TValue) => StorageEntry<TValue>;

type StorageConfig = {
  storage: StorageEntryHandler;
  clearStorage: boolean;
};

type StorageOptions = {
  storage?: StorageEntryCreator;
  clearStorage?: boolean;
  storageNamespace?: string;
};

export {
  StorageEntry,
  StorageEntryKey,
  StorageEntryHandler,
  StorageConfig,
  StorageOptions,
  StorageEntryCreator,
};
